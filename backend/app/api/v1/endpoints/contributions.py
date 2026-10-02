import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.contribution import Contribution
from backend.app.models.member import Member
from backend.app.models.group import Group
from backend.app.models.transaction import FinancialTransaction
from backend.app.models.user import User
from backend.app.schemas.contribution import (
    ContributionCreate,
    ContributionPay,
    ContributionResponse,
    ContributionGenerateMonth
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ContributionResponse])
def get_contributions(
    member_id: Optional[int] = None,
    group_id: Optional[int] = None,
    contribution_month: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("contributions.view"))
) -> Any:
    query = db.query(Contribution)
    if member_id:
        query = query.filter(Contribution.member_id == member_id)
    if group_id:
        query = query.filter(Contribution.group_id == group_id)
    if contribution_month:
        query = query.filter(Contribution.contribution_month == contribution_month)
    if status:
        query = query.filter(Contribution.status == status)

    total = query.count()
    items = query.order_by(Contribution.contribution_month.desc(), Contribution.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.post("/generate-month")
def generate_monthly_dues(
    gen_in: ContributionGenerateMonth,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("contributions.create"))
) -> Any:
    """Generates monthly DUE contribution records for all active members who don't already have one for the month."""
    members = db.query(Member).filter(Member.status == "ACTIVE").all()
    created_count = 0

    # Resolve Foundation-wide monthly contribution setting applicable for this month
    month_amount = AccountingService.get_monthly_contribution_amount(db, gen_in.contribution_month)

    existing_records = db.query(Contribution.member_id).filter(
        Contribution.contribution_month == gen_in.contribution_month
    ).all()
    existing_member_ids = {r[0] for r in existing_records}

    for m in members:
        if m.id not in existing_member_ids:
            unique_code = uuid.uuid4().hex[:6].upper()
            c_num = f"CON-{gen_in.contribution_month.replace('-', '')}-{m.member_number}-{unique_code}"
            
            contrib = Contribution(
                contribution_number=c_num,
                member_id=m.id,
                group_id=m.group_id,
                contribution_month=gen_in.contribution_month,
                amount=month_amount,
                status="DUE",
                created_by_id=current_user.id
            )
            db.add(contrib)
            created_count += 1

    db.commit()
    return {"success": True, "created_records": created_count, "month": gen_in.contribution_month, "amount_per_member": str(month_amount)}


@router.post("", response_model=ContributionResponse)
def record_contribution(
    contrib_in: ContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("contributions.create"))
) -> Any:
    """
    Directly creates and records a paid monthly contribution for a member.
    The money is atomically credited to the member's assigned group.
    """
    member = db.query(Member).filter(Member.id == contrib_in.member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    amount = contrib_in.amount if contrib_in.amount is not None else AccountingService.get_monthly_contribution_amount(db, contrib_in.contribution_month)
    if amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")

    # Check for existing contribution for this month
    existing = db.query(Contribution).filter(
        Contribution.member_id == member.id,
        Contribution.contribution_month == contrib_in.contribution_month
    ).first()

    if existing and existing.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contribution for month {contrib_in.contribution_month} is already paid"
        )

    # 1. Create Financial Transaction in member's group (atomic)
    txn = AccountingService.create_transaction(
        db=db,
        group_id=member.group_id,
        transaction_type="CONTRIBUTION",
        flow_type="INFLOW",
        amount=amount,
        description=f"Monthly Contribution for {contrib_in.contribution_month} - {member.full_name} ({member.member_number})",
        payment_method=contrib_in.payment_method or "CASH",
        reference=contrib_in.reference,
        related_entity_type="member",
        related_entity_id=member.id,
        created_by_id=current_user.id,
        check_sufficient_funds=False
    )

    if existing:
        contrib = existing
        contrib.amount = amount
        contrib.status = "PAID"
        contrib.payment_date = date.today()
        contrib.payment_method = contrib_in.payment_method or "CASH"
        contrib.reference = contrib_in.reference
        contrib.notes = contrib_in.notes
        contrib.transaction_id = txn.id
    else:
        unique_code = uuid.uuid4().hex[:6].upper()
        c_num = f"CON-{contrib_in.contribution_month.replace('-', '')}-{member.member_number}-{unique_code}"
        contrib = Contribution(
            contribution_number=c_num,
            member_id=member.id,
            group_id=member.group_id,
            contribution_month=contrib_in.contribution_month,
            amount=amount,
            status="PAID",
            payment_date=date.today(),
            payment_method=contrib_in.payment_method or "CASH",
            reference=contrib_in.reference,
            notes=contrib_in.notes,
            transaction_id=txn.id,
            created_by_id=current_user.id
        )
        db.add(contrib)

    db.commit()
    db.refresh(contrib)
    cache.invalidate_financial_caches(member.group_id)

    AuditService.log(
        db, action="CREATE", module="contributions", record_id=str(contrib.id),
        user=current_user,
        new_values={
            "member": member.full_name,
            "group_id": member.group_id,
            "month": contrib.contribution_month,
            "amount": str(contrib.amount)
        }
    )
    db.commit()
    return contrib


@router.post("/{contrib_id}/pay", response_model=ContributionResponse)
def pay_existing_contribution(
    contrib_id: int,
    pay_in: ContributionPay,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("contributions.create"))
) -> Any:
    """Pay an existing DUE or CURRENT_PENDING contribution."""
    contrib = db.query(Contribution).filter(Contribution.id == contrib_id).first()
    if not contrib:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contribution not found")
    if contrib.status == "PAID":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contribution is already paid")

    member = contrib.member
    pay_date = pay_in.payment_date or date.today()

    txn = AccountingService.create_transaction(
        db=db,
        group_id=contrib.group_id,
        transaction_type="CONTRIBUTION",
        flow_type="INFLOW",
        amount=contrib.amount,
        description=f"Monthly Contribution for {contrib.contribution_month} - {member.full_name} ({member.member_number})",
        payment_method=pay_in.payment_method,
        reference=pay_in.reference,
        related_entity_type="member",
        related_entity_id=member.id,
        created_by_id=current_user.id,
        check_sufficient_funds=False
    )

    contrib.status = "PAID"
    contrib.payment_date = pay_date
    contrib.payment_method = pay_in.payment_method
    contrib.reference = pay_in.reference
    if pay_in.notes:
        contrib.notes = f"{contrib.notes or ''}\n{pay_in.notes}".strip()
    contrib.transaction_id = txn.id

    db.commit()
    db.refresh(contrib)
    cache.invalidate_financial_caches(contrib.group_id)

    AuditService.log(
        db, action="PAY", module="contributions", record_id=str(contrib.id),
        user=current_user,
        new_values={
            "member_id": contrib.member_id,
            "month": contrib.contribution_month,
            "amount": str(contrib.amount)
        }
    )
    db.commit()
    return contrib
