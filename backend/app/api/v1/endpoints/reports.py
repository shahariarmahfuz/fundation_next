from datetime import date, datetime
from decimal import Decimal
from typing import List, Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.transaction import FinancialTransaction
from backend.app.models.group import Group
from backend.app.models.member import Member
from backend.app.models.contribution import Contribution
from backend.app.models.donor import Donation
from backend.app.models.qard_hasan import QardHasan
from backend.app.models.user import User
from backend.app.schemas.report import FinancialReportResponse, MemberLedgerResponse, MemberLedgerEntry
from backend.app.api.deps import require_permission
from backend.app.services.accounting_service import AccountingService

router = APIRouter()


@router.get("/financial", response_model=FinancialReportResponse)
def get_financial_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    group_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("reports.view"))
) -> Any:
    query = db.query(FinancialTransaction)
    group_name = None

    if group_id:
        group = db.query(Group).filter(Group.id == group_id).first()
        if group:
            group_name = group.name
            query = query.filter(FinancialTransaction.group_id == group_id)

    if date_from:
        query = query.filter(FinancialTransaction.transaction_date >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(FinancialTransaction.transaction_date <= datetime.combine(date_to, datetime.max.time()))

    txns = query.order_by(FinancialTransaction.transaction_date.asc()).all()

    total_inflow = Decimal("0.00")
    total_outflow = Decimal("0.00")
    breakdown_by_type: Dict[str, Decimal] = {}
    items = []

    for t in txns:
        if t.flow_type == "INFLOW":
            total_inflow += t.amount
        elif t.flow_type == "OUTFLOW":
            total_outflow += t.amount

        t_type = t.transaction_type
        breakdown_by_type[t_type] = breakdown_by_type.get(t_type, Decimal("0.00")) + t.amount

        items.append({
            "id": t.id,
            "transaction_number": t.transaction_number,
            "date": t.transaction_date,
            "group_id": t.group_id,
            "transaction_type": t.transaction_type,
            "flow_type": t.flow_type,
            "amount": t.amount,
            "description": t.description,
            "reference": t.reference,
            "payment_method": t.payment_method
        })

    return FinancialReportResponse(
        report_title="Comprehensive Financial Statement",
        date_from=date_from,
        date_to=date_to,
        group_id=group_id,
        group_name=group_name,
        total_inflow=total_inflow,
        total_outflow=total_outflow,
        net_change=total_inflow - total_outflow,
        breakdown_by_type=breakdown_by_type,
        items=items
    )


@router.get("/group-balances")
def get_group_balances_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("reports.view"))
) -> Any:
    groups = db.query(Group).order_by(Group.id).all()
    results = []
    total_foundation_balance = Decimal("0.00")

    for g in groups:
        bal = AccountingService.get_group_current_balance(db, g.id)
        total_foundation_balance += bal

        inflows = db.query(func.coalesce(func.sum(FinancialTransaction.amount), Decimal("0.00"))).filter(
            FinancialTransaction.group_id == g.id,
            FinancialTransaction.flow_type == "INFLOW"
        ).scalar() or Decimal("0.00")

        outflows = db.query(func.coalesce(func.sum(FinancialTransaction.amount), Decimal("0.00"))).filter(
            FinancialTransaction.group_id == g.id,
            FinancialTransaction.flow_type == "OUTFLOW"
        ).scalar() or Decimal("0.00")

        results.append({
            "group_id": g.id,
            "group_code": g.code,
            "group_name": g.name,
            "status": g.status,
            "opening_balance": g.opening_balance,
            "total_inflows": inflows,
            "total_outflows": outflows,
            "closing_balance": bal
        })

    return {
        "groups": results,
        "total_foundation_balance": total_foundation_balance
    }


@router.get("/member-ledger/{member_id}", response_model=MemberLedgerResponse)
def get_member_ledger(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("reports.view"))
) -> Any:
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    contribs = db.query(Contribution).filter(
        Contribution.member_id == member.id
    ).order_by(Contribution.contribution_month.desc()).all()

    total_paid = Decimal("0.00")
    total_due = Decimal("0.00")
    entries = []

    for c in contribs:
        if c.status == "PAID":
            total_paid += c.amount
        else:
            total_due += c.amount

        entries.append(MemberLedgerEntry(
            date=c.payment_date or c.created_at.date(),
            type="Monthly Contribution",
            description=f"Contribution for month {c.contribution_month}",
            amount=c.amount,
            status=c.status,
            reference=c.reference
        ))

    # Traceable member donations
    member_donations = db.query(Donation).filter(
        Donation.member_id == member.id
    ).order_by(Donation.donation_date.desc()).all()

    for d in member_donations:
        total_paid += d.amount
        entries.append(MemberLedgerEntry(
            date=d.donation_date,
            type="Member Donation",
            description=f"Donation credited to {d.group.name if d.group else 'Group'}",
            amount=d.amount,
            status="PAID",
            reference=d.reference or d.donation_number
        ))

    # Sort all entries chronologically descending
    entries.sort(key=lambda x: x.date, reverse=True)

    return MemberLedgerResponse(
        member_id=member.id,
        member_name=member.full_name,
        member_number=member.member_number,
        group_name=member.group.name,
        monthly_rate=AccountingService.get_monthly_contribution_amount(db),
        total_paid=total_paid,
        total_due=total_due,
        entries=entries
    )


@router.get("/outstanding-qard")
def get_outstanding_qard_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("reports.view"))
) -> Any:
    loans = db.query(QardHasan).filter(QardHasan.status == "ACTIVE").order_by(QardHasan.disbursed_date.asc()).all()
    total_principal = sum((l.principal_amount for l in loans), Decimal("0.00"))
    total_repaid = sum((l.total_repaid for l in loans), Decimal("0.00"))
    total_outstanding = sum((l.outstanding_amount for l in loans), Decimal("0.00"))

    return {
        "total_active_loans": len(loans),
        "total_principal": total_principal,
        "total_repaid": total_repaid,
        "total_outstanding": total_outstanding,
        "loans": [
            {
                "id": l.id,
                "qard_number": l.qard_number,
                "beneficiary_name": l.beneficiary.name,
                "beneficiary_phone": l.beneficiary.phone,
                "group_name": l.group.name,
                "principal_amount": l.principal_amount,
                "total_repaid": l.total_repaid,
                "outstanding_amount": l.outstanding_amount,
                "monthly_repayment_amount": l.monthly_repayment_amount,
                "disbursed_date": l.disbursed_date
            }
            for l in loans
        ]
    }
