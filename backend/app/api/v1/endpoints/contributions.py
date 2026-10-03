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
    ContributionGenerateMonth,
    ContributionBatchCreate,
    PeriodStatusItem,
    MemberPeriodsResponse,
    ContributionBatchResponse
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService
from backend.app.services.timezone_service import TimezoneService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ContributionResponse])
def get_contributions(
    member_id: Optional[int] = None,
    group_id: Optional[int] = None,
    contribution_month: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
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


@router.get("/applicable-amount")
def get_applicable_contribution_amount(
    contribution_month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Returns the configured Foundation monthly contribution amount for the specified month."""
    month_str = contribution_month or TimezoneService.current_month(db)
    amount = AccountingService.get_monthly_contribution_amount(db, month_str)
    return {
        "contribution_month": month_str,
        "amount": str(amount)
    }


@router.get("/check-duplicate")
def check_duplicate_contribution(
    member_id: int = Query(...),
    contribution_month: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Checks whether a PAID contribution already exists for the given member and month."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    existing = db.query(Contribution).filter(
        Contribution.member_id == member_id,
        Contribution.contribution_month == contribution_month
    ).first()

    is_paid = existing is not None and existing.status == "PAID"
    return {
        "exists": existing is not None,
        "is_paid": is_paid,
        "status": existing.status if existing else None,
        "member_id": member_id,
        "member_name": member.full_name,
        "contribution_month": contribution_month,
        "message": f"A contribution for {member.full_name} for {contribution_month} already exists." if is_paid else None
    }


MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


@router.get("/member-periods", response_model=MemberPeriodsResponse)
def get_member_contribution_periods(
    member_id: int = Query(...),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Returns the contribution status for each month of the selected year for a member,
    including rate calculation, PAID/DUE/CURRENT_PENDING/FUTURE status, and summary metrics.
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    today = TimezoneService.today(db)
    current_year = today.year
    current_month_str = today.strftime("%Y-%m")
    target_year = year or current_year

    available_years = [current_year - 2, current_year - 1, current_year, current_year + 1, current_year + 2]

    # Query all contributions for this member to accurately determine status and historical dues
    all_contribs = db.query(Contribution).filter(Contribution.member_id == member.id).all()
    contrib_map = {c.contribution_month: c for c in all_contribs}

    periods = []
    paid_count = 0
    due_count = 0
    current_pending_count = 0
    future_count = 0
    total_due_amount = Decimal("0.00")

    for month_idx in range(1, 13):
        m_str = f"{target_year}-{str(month_idx).zfill(2)}"
        m_name = MONTH_NAMES[month_idx - 1]

        c = contrib_map.get(m_str)
        if c and c.status == "PAID":
            status_str = "PAID"
            is_paid = True
            is_selectable = False
            amt = c.amount
            payment_date = c.payment_date
            payment_method = c.payment_method
            reference = c.reference
            contribution_id = c.id
            transaction_id = c.transaction_id
            paid_count += 1
        else:
            is_paid = False
            is_selectable = True
            payment_date = None
            payment_method = None
            reference = None
            contribution_id = c.id if c else None
            transaction_id = None
            amt = AccountingService.get_monthly_contribution_amount(db, m_str)
            if m_str < current_month_str:
                status_str = "DUE"
                due_count += 1
                total_due_amount += amt
            elif m_str == current_month_str:
                status_str = "CURRENT_PENDING"
                current_pending_count += 1
                total_due_amount += amt
            else:
                status_str = "FUTURE"
                future_count += 1

        periods.append(PeriodStatusItem(
            month=m_str,
            year=target_year,
            month_num=month_idx,
            month_name=m_name,
            status=status_str,
            is_paid=is_paid,
            is_selectable=is_selectable,
            amount=amt,
            payment_date=payment_date,
            payment_method=payment_method,
            reference=reference,
            contribution_id=contribution_id,
            transaction_id=transaction_id
        ))

    # Also detect any unpaid months in previous years
    earlier_unpaid = []
    for c_month, c in contrib_map.items():
        if c_month < f"{target_year}-01" and c.status != "PAID":
            earlier_unpaid.append(c_month)

    summary = {
        "paid_count": paid_count,
        "due_count": due_count,
        "current_pending_count": current_pending_count,
        "future_count": future_count,
        "total_due_amount": str(total_due_amount),
        "earlier_unpaid_months": sorted(earlier_unpaid),
    }

    group_name = member.group.name if member.group else f"Group #{member.group_id}"

    return MemberPeriodsResponse(
        member_id=member.id,
        member_name=member.full_name,
        member_number=member.member_number,
        group_id=member.group_id,
        group_name=group_name,
        current_month=current_month_str,
        available_years=available_years,
        selected_year=target_year,
        periods=periods,
        summary=summary
    )


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


@router.post("/receive-batch", response_model=ContributionBatchResponse)
def receive_multiple_contributions(
    batch_in: ContributionBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("contributions.create"))
) -> Any:
    """
    Receives and records multiple monthly contributions for a member in a single atomic transaction.
    Supports any combination of past due months, current month, and advance future months.
    Guarantees normalized storage (one Contribution record per month) linked to a single FinancialTransaction.
    """
    member = db.query(Member).filter(Member.id == batch_in.member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    sorted_months = sorted(list(set(batch_in.months)))
    if not sorted_months:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No contribution months selected")

    # Check for already paid months
    already_paid = db.query(Contribution).filter(
        Contribution.member_id == member.id,
        Contribution.contribution_month.in_(sorted_months),
        Contribution.status == "PAID"
    ).all()

    if already_paid:
        paid_str = ", ".join([p.contribution_month for p in already_paid])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The following month(s) are already paid for {member.full_name}: {paid_str}"
        )

    # Compute time-aware rates for each month
    month_rates = []
    total_amount = Decimal("0.00")
    for m in sorted_months:
        rate = AccountingService.get_monthly_contribution_amount(db, m)
        if rate <= Decimal("0.00"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid calculated rate for month {m}")
        month_rates.append((m, rate))
        total_amount += rate

    pay_date = batch_in.payment_date or TimezoneService.today(db)
    months_display = ", ".join(sorted_months)

    # 1. Create single Financial Transaction in member's group (atomic inflow)
    txn = AccountingService.create_transaction(
        db=db,
        group_id=member.group_id,
        transaction_type="CONTRIBUTION",
        flow_type="INFLOW",
        amount=total_amount,
        description=f"Monthly Contribution for {months_display} - {member.full_name} ({member.member_number})",
        payment_method=batch_in.payment_method or "CASH",
        reference=batch_in.reference,
        related_entity_type="member",
        related_entity_id=member.id,
        created_by_id=current_user.id,
        check_sufficient_funds=False
    )

    # 2. Upsert Contribution records for each month
    contributions = []
    for m, rate in month_rates:
        existing = db.query(Contribution).filter(
            Contribution.member_id == member.id,
            Contribution.contribution_month == m
        ).first()

        if existing:
            existing.amount = rate
            existing.status = "PAID"
            existing.payment_date = pay_date
            existing.payment_method = batch_in.payment_method or "CASH"
            existing.reference = batch_in.reference
            existing.notes = batch_in.notes
            existing.transaction_id = txn.id
            contributions.append(existing)
        else:
            unique_code = uuid.uuid4().hex[:6].upper()
            c_num = f"CON-{m.replace('-', '')}-{member.member_number}-{unique_code}"
            contrib = Contribution(
                contribution_number=c_num,
                member_id=member.id,
                group_id=member.group_id,
                contribution_month=m,
                amount=rate,
                status="PAID",
                payment_date=pay_date,
                payment_method=batch_in.payment_method or "CASH",
                reference=batch_in.reference,
                notes=batch_in.notes,
                transaction_id=txn.id,
                created_by_id=current_user.id
            )
            db.add(contrib)
            contributions.append(contrib)

    db.commit()
    for c in contributions:
        db.refresh(c)

    cache.invalidate_financial_caches(member.group_id)

    AuditService.log(
        db, action="RECEIVE_BATCH", module="contributions", record_id=str(txn.id),
        user=current_user,
        new_values={
            "member": member.full_name,
            "member_number": member.member_number,
            "group_id": member.group_id,
            "months": sorted_months,
            "count": len(sorted_months),
            "total_amount": str(total_amount),
            "transaction_number": txn.transaction_number
        }
    )
    db.commit()

    group_name = member.group.name if member.group else f"Group #{member.group_id}"

    return ContributionBatchResponse(
        success=True,
        transaction_id=txn.id,
        transaction_number=txn.transaction_number,
        member_id=member.id,
        member_name=member.full_name,
        member_number=member.member_number,
        group_id=member.group_id,
        group_name=group_name,
        months=sorted_months,
        months_count=len(sorted_months),
        total_amount=total_amount,
        payment_method=batch_in.payment_method or "CASH",
        reference=batch_in.reference,
        contributions=contributions
    )


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
            detail=f"A contribution for {member.full_name} for {contrib_in.contribution_month} already exists."
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
        contrib.payment_date = TimezoneService.today(db)
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
            payment_date=TimezoneService.today(db),
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
    pay_date = pay_in.payment_date or TimezoneService.today(db)

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
