import uuid
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

import calendar
from backend.app.models.group import Group
from backend.app.models.transaction import FinancialTransaction
from backend.app.models.contribution import Contribution
from backend.app.models.qard_hasan import QardHasan, QardRepayment
from backend.app.models.donor import Donation
from backend.app.models.expense import Expense
from backend.app.models.sadakah import Sadakah
from backend.app.models.monthly_contribution_setting import MonthlyContributionSetting
from backend.app.core.cache import cache
from backend.app.services.timezone_service import TimezoneService


class AccountingService:
    @staticmethod
    def get_monthly_contribution_amount(db: Session, contribution_month: Optional[str] = None) -> Decimal:
        """
        Resolves the Foundation Monthly Contribution amount applicable for a given month or date.
        Uses time-based effective_from resolution.
        """
        if contribution_month:
            try:
                parts = [int(p) for p in contribution_month.split("-")]
                last_day = calendar.monthrange(parts[0], parts[1])[1]
                target_date = date(parts[0], parts[1], last_day)
            except Exception:
                target_date = TimezoneService.today(db)
        else:
            target_date = TimezoneService.today(db)

        setting = db.query(MonthlyContributionSetting).filter(
            MonthlyContributionSetting.effective_from <= target_date
        ).order_by(MonthlyContributionSetting.effective_from.desc()).first()

        if setting:
            return setting.amount

        earliest = db.query(MonthlyContributionSetting).order_by(MonthlyContributionSetting.effective_from.asc()).first()
        if earliest:
            return earliest.amount

        return Decimal("100.00")

    @staticmethod
    def get_monthly_contribution_overview(db: Session):
        today = TimezoneService.today(db)
        all_settings = db.query(MonthlyContributionSetting).order_by(MonthlyContributionSetting.effective_from.desc()).all()
        
        active_setting = None
        for s in all_settings:
            if s.effective_from <= today:
                active_setting = s
                break
        
        current_amount = active_setting.amount if active_setting else (all_settings[0].amount if all_settings else Decimal("100.00"))
        effective_date = active_setting.effective_from if active_setting else today

        scheduled = []
        history = []
        for s in all_settings:
            creator_name = s.created_by.full_name if s.created_by else None
            if s.effective_from > today:
                status_str = "SCHEDULED"
            elif active_setting and s.id == active_setting.id:
                status_str = "ACTIVE"
            else:
                status_str = "HISTORICAL"
            
            entry = {
                "id": s.id,
                "amount": s.amount,
                "effective_from": s.effective_from,
                "notes": s.notes,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
                "created_by_id": s.created_by_id,
                "created_by_name": creator_name,
                "status": status_str
            }
            if status_str == "SCHEDULED":
                scheduled.append(entry)
            history.append(entry)

        active_dict = None
        if active_setting:
            active_dict = {
                "id": active_setting.id,
                "amount": active_setting.amount,
                "effective_from": active_setting.effective_from,
                "notes": active_setting.notes,
                "created_at": active_setting.created_at,
                "updated_at": active_setting.updated_at,
                "created_by_id": active_setting.created_by_id,
                "created_by_name": active_setting.created_by.full_name if active_setting.created_by else None,
                "status": "ACTIVE"
            }

        return {
            "current_amount": current_amount,
            "effective_date": effective_date,
            "active_setting": active_dict,
            "scheduled_settings": scheduled,
            "history": history
        }
    @staticmethod
    def get_group_current_balance(db: Session, group_id: int) -> Decimal:
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        
        # Calculate balance conceptually:
        # Opening balance + sum of all journal INFLOWs - sum of all journal OUTFLOWs
        inflows = db.query(func.coalesce(func.sum(FinancialTransaction.amount), Decimal("0.00"))).filter(
            FinancialTransaction.group_id == group_id,
            FinancialTransaction.flow_type == "INFLOW"
        ).scalar() or Decimal("0.00")

        outflows = db.query(func.coalesce(func.sum(FinancialTransaction.amount), Decimal("0.00"))).filter(
            FinancialTransaction.group_id == group_id,
            FinancialTransaction.flow_type == "OUTFLOW"
        ).scalar() or Decimal("0.00")

        return group.opening_balance + inflows - outflows

    # Alias for convenience
    get_group_balance = get_group_current_balance

    @staticmethod
    def create_transaction(
        db: Session,
        group_id: int,
        transaction_type: str,
        flow_type: str,
        amount: Decimal,
        description: str,
        payment_method: str = "CASH",
        reference: Optional[str] = None,
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[int] = None,
        created_by_id: Optional[int] = None,
        transaction_date: Optional[datetime] = None,
        check_sufficient_funds: bool = True
    ) -> FinancialTransaction:
        if amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction amount must be strictly positive"
            )

        current_balance = AccountingService.get_group_current_balance(db, group_id)

        if flow_type == "OUTFLOW":
            # Concurrency protection: acquire row lock on Group to serialize simultaneous disbursements
            if check_sufficient_funds:
                group_lock = db.query(Group).filter(Group.id == group_id).with_for_update().first()
                if not group_lock:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
            current_balance = AccountingService.get_group_current_balance(db, group_id)
            if check_sufficient_funds and current_balance < amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient funds in Group. Available: ৳{current_balance:,.2f}, Requested: ৳{amount:,.2f}"
                )
            new_balance = current_balance - amount
        elif flow_type == "INFLOW":
            current_balance = AccountingService.get_group_current_balance(db, group_id)
            new_balance = current_balance + amount
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid flow type '{flow_type}'. Must be INFLOW or OUTFLOW."
            )

        txn_date = transaction_date or datetime.now(timezone.utc)
        unique_suffix = uuid.uuid4().hex[:6].upper()
        txn_number = f"TXN-{txn_date.strftime('%Y%m%d')}-{unique_suffix}"

        txn = FinancialTransaction(
            transaction_number=txn_number,
            group_id=group_id,
            transaction_type=transaction_type,
            flow_type=flow_type,
            amount=amount,
            transaction_date=txn_date,
            balance_after=new_balance,
            description=description,
            reference=reference,
            payment_method=payment_method,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            created_by_id=created_by_id,
            is_reversed=False
        )
        db.add(txn)
        db.flush()  # assign ID

        return txn

    @staticmethod
    def transfer_funds(
        db: Session,
        source_group_id: int,
        destination_group_id: int,
        amount: Decimal,
        notes: Optional[str] = None,
        user_id: Optional[int] = None,
        payment_method: str = "INTERNAL_TRANSFER"
    ) -> Tuple[FinancialTransaction, FinancialTransaction]:
        if source_group_id == destination_group_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source and destination groups must be different"
            )
        if amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transfer amount must be strictly positive"
            )

        src_group = db.query(Group).filter(Group.id == source_group_id).first()
        dest_group = db.query(Group).filter(Group.id == destination_group_id).first()
        if not src_group or not dest_group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source or destination group not found")

        transfer_code = uuid.uuid4().hex[:6].upper()
        ref_code = f"TRF-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{transfer_code}"

        # 1. Outflow from source group (locks row & checks funds)
        outflow_txn = AccountingService.create_transaction(
            db=db,
            group_id=source_group_id,
            transaction_type="TRANSFER_OUT",
            flow_type="OUTFLOW",
            amount=amount,
            description=f"Transfer to {dest_group.name} ({dest_group.code}): {notes or 'Inter-group fund transfer'}",
            payment_method=payment_method,
            reference=ref_code,
            related_entity_type="group",
            related_entity_id=destination_group_id,
            created_by_id=user_id,
            check_sufficient_funds=True
        )

        # 2. Inflow into destination group
        inflow_txn = AccountingService.create_transaction(
            db=db,
            group_id=destination_group_id,
            transaction_type="TRANSFER_IN",
            flow_type="INFLOW",
            amount=amount,
            description=f"Transfer from {src_group.name} ({src_group.code}): {notes or 'Inter-group fund transfer'}",
            payment_method=payment_method,
            reference=ref_code,
            related_entity_type="group",
            related_entity_id=source_group_id,
            created_by_id=user_id,
            check_sufficient_funds=False
        )

        db.flush()
        cache.invalidate_financial_caches(source_group_id)
        cache.invalidate_financial_caches(destination_group_id)
        return outflow_txn, inflow_txn

    @staticmethod
    def reverse_transaction(
        db: Session,
        transaction_id: int,
        user_id: int,
        reversal_reason: str
    ) -> FinancialTransaction:
        orig = db.query(FinancialTransaction).filter(FinancialTransaction.id == transaction_id).first()
        if not orig:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        if orig.is_reversed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction has already been reversed")

        opposite_flow = "OUTFLOW" if orig.flow_type == "INFLOW" else "INFLOW"
        
        # Create offsetting reversal transaction
        reversal_txn = AccountingService.create_transaction(
            db=db,
            group_id=orig.group_id,
            transaction_type="REVERSAL",
            flow_type=opposite_flow,
            amount=orig.amount,
            description=f"Reversal of {orig.transaction_number}: {reversal_reason}",
            payment_method=orig.payment_method,
            reference=f"REV-{orig.transaction_number}",
            related_entity_type=orig.related_entity_type,
            related_entity_id=orig.related_entity_id,
            created_by_id=user_id,
            check_sufficient_funds=(opposite_flow == "OUTFLOW")
        )

        orig.is_reversed = True
        orig.reversed_by_id = user_id
        orig.reversal_reason = reversal_reason
        orig.reversal_transaction_id = reversal_txn.id

        # Synchronize associated domain entity statuses upon reversal
        if orig.transaction_type == "CONTRIBUTION":
            contrib = db.query(Contribution).filter(Contribution.transaction_id == orig.id).first()
            if contrib:
                contrib.status = "DUE"
                contrib.payment_date = None
                contrib.transaction_id = None
                contrib.notes = f"{contrib.notes or ''}\n[REVERSED: {reversal_reason}]".strip()

        elif orig.transaction_type == "QARD_HASAN_REPAYMENT":
            repayment = db.query(QardRepayment).filter(QardRepayment.transaction_id == orig.id).first()
            if repayment:
                qard = repayment.qard_hasan
                if qard:
                    qard.total_repaid = max(Decimal("0.00"), qard.total_repaid - orig.amount)
                    qard.outstanding_amount += orig.amount
                    qard.status = "ACTIVE"
                repayment.notes = f"{repayment.notes or ''}\n[REVERSED: {reversal_reason}]".strip()

        elif orig.transaction_type == "QARD_HASAN_DISBURSEMENT":
            qard = db.query(QardHasan).filter(QardHasan.disbursement_transaction_id == orig.id).first()
            if qard:
                qard.status = "CANCELLED"
                qard.outstanding_amount = Decimal("0.00")
                qard.notes = f"{qard.notes or ''}\n[DISBURSEMENT REVERSED: {reversal_reason}]".strip()

        elif orig.transaction_type == "DONATION":
            donation = db.query(Donation).filter(Donation.transaction_id == orig.id).first()
            if donation:
                donation.notes = f"{donation.notes or ''}\n[REVERSED: {reversal_reason}]".strip()

        elif orig.transaction_type == "EXPENSE":
            expense = db.query(Expense).filter(Expense.transaction_id == orig.id).first()
            if expense:
                expense.notes = f"{expense.notes or ''}\n[REVERSED: {reversal_reason}]".strip()

        elif orig.transaction_type == "SADAKAH":
            sadakah = db.query(Sadakah).filter(Sadakah.transaction_id == orig.id).first()
            if sadakah:
                sadakah.notes = f"{sadakah.notes or ''}\n[REVERSED: {reversal_reason}]".strip()

        db.flush()
        cache.invalidate_financial_caches(orig.group_id)
        return reversal_txn
