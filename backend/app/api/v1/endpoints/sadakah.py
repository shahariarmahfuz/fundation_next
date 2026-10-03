import uuid
from decimal import Decimal
from typing import List, Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.sadakah import Sadakah, SadakahFundingAllocation
from backend.app.models.beneficiary import Beneficiary
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.schemas.sadakah import (
    SadakahResponse,
    SadakahCreate,
    SadakahFundingAllocationCreate,
    SadakahFundingAllocationResponse,
    SadakahLedgerResponse,
    SadakahLedgerItem
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService
from backend.app.services.timezone_service import TimezoneService

router = APIRouter()


@router.get("/ledger", response_model=SadakahLedgerResponse)
def get_sadakah_ledger(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    group_id: Optional[int] = None,
    beneficiary_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sadakah.view"))
) -> Any:
    """
    Comprehensive ledger of all non-repayable Sadaqah disbursements with
    exact group allocations and audit trails.
    """
    query = db.query(Sadakah).outerjoin(Beneficiary, Sadakah.beneficiary_id == Beneficiary.id)

    if group_id:
        query = query.filter(
            or_(
                Sadakah.group_id == group_id,
                Sadakah.id.in_(
                    db.query(SadakahFundingAllocation.sadakah_id).filter(
                        SadakahFundingAllocation.group_id == group_id
                    )
                )
            )
        )

    if beneficiary_id:
        query = query.filter(Sadakah.beneficiary_id == beneficiary_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Sadakah.sadakah_number.ilike(term),
                Beneficiary.name.ilike(term),
                Beneficiary.beneficiary_number.ilike(term),
                Beneficiary.phone.ilike(term),
                Sadakah.description.ilike(term),
                Sadakah.reference.ilike(term)
            )
        )

    # Calculate summary metrics safely
    summary_data = query.with_entities(
        func.coalesce(func.sum(Sadakah.amount), Decimal("0.00")).label("total_amount"),
        func.count(Sadakah.id).label("total_count"),
        func.count(func.distinct(Sadakah.beneficiary_id)).label("beneficiary_count")
    ).first()

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    records = query.order_by(
        Sadakah.disbursement_date.desc().nullslast(),
        Sadakah.id.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()

    ledger_items = []
    for s in records:
        funding_groups = []
        if s.funding_allocations:
            for fa in s.funding_allocations:
                g_name = fa.group.name if fa.group else f"Group #{fa.group_id}"
                funding_groups.append(f"{g_name} (৳{fa.allocated_amount:,.2f})")
        elif s.group:
            funding_groups.append(f"{s.group.name} (৳{s.amount:,.2f})")

        creator_name = s.created_by.full_name if s.created_by else (s.created_by.username if s.created_by else None)

        ledger_items.append(SadakahLedgerItem(
            id=s.id,
            sadakah_number=s.sadakah_number,
            disbursement_date=s.disbursement_date,
            beneficiary_id=s.beneficiary_id,
            beneficiary_name=s.beneficiary.name if s.beneficiary else "Unknown",
            beneficiary_number=s.beneficiary.beneficiary_number if s.beneficiary else "",
            amount=s.amount,
            description=s.description or "",
            payment_method=s.payment_method or "CASH",
            reference=s.reference,
            created_by_name=creator_name,
            funding_groups=funding_groups,
            funding_allocations=[SadakahFundingAllocationResponse.model_validate(fa) for fa in s.funding_allocations]
        ))

    summary = {
        "total_amount": str(getattr(summary_data, "total_amount", None) or "0.00"),
        "total_count": total,
        "beneficiary_count": getattr(summary_data, "beneficiary_count", None) or 0,
    }

    return SadakahLedgerResponse(
        items=ledger_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        summary=summary
    )


@router.get("/summary")
def get_sadakah_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sadakah.view"))
) -> Any:
    """Safe aggregated summary metrics for Sadaqah humanitarian assistance."""
    summary_data = db.query(
        func.coalesce(func.sum(Sadakah.amount), Decimal("0.00")).label("total_amount"),
        func.count(Sadakah.id).label("total_count"),
        func.count(func.distinct(Sadakah.beneficiary_id)).label("beneficiary_count")
    ).first()

    return {
        "total_amount": str(getattr(summary_data, "total_amount", None) or "0.00"),
        "total_count": getattr(summary_data, "total_count", None) or 0,
        "beneficiary_count": getattr(summary_data, "beneficiary_count", None) or 0,
    }


@router.get("", response_model=PaginatedResponse[SadakahResponse])
def get_sadakah_grants(
    group_id: Optional[int] = None,
    beneficiary_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sadakah.view"))
) -> Any:
    query = db.query(Sadakah).outerjoin(Beneficiary, Sadakah.beneficiary_id == Beneficiary.id)

    if group_id:
        query = query.filter(
            or_(
                Sadakah.group_id == group_id,
                Sadakah.id.in_(
                    db.query(SadakahFundingAllocation.sadakah_id).filter(
                        SadakahFundingAllocation.group_id == group_id
                    )
                )
            )
        )

    if beneficiary_id:
        query = query.filter(Sadakah.beneficiary_id == beneficiary_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Sadakah.sadakah_number.ilike(term),
                Beneficiary.name.ilike(term),
                Beneficiary.beneficiary_number.ilike(term),
                Beneficiary.phone.ilike(term),
                Sadakah.description.ilike(term),
                Sadakah.reference.ilike(term)
            )
        )

    total = query.count()
    items = query.order_by(
        Sadakah.disbursement_date.desc().nullslast(),
        Sadakah.id.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{sadakah_id}", response_model=SadakahResponse)
def get_sadakah_detail(
    sadakah_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sadakah.view"))
) -> Any:
    grant = db.query(Sadakah).filter(Sadakah.id == sadakah_id).first()
    if not grant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sadaqah grant record not found")
    return grant


@router.post("", response_model=SadakahResponse)
def disburse_sadakah(
    sad_in: SadakahCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sadakah.create"))
) -> Any:
    """
    Disburses non-repayable Sadaqah humanitarian assistance funded by one or multiple groups.
    Enforces row-level concurrency locking and exact allocation validation inside an atomic transaction.
    Permanently reduces the contributing group balances. No receivable is created.
    """
    if sad_in.amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sadaqah amount must be strictly positive")

    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == sad_in.beneficiary_id).first()
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected Beneficiary does not exist")
    if beneficiary.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Beneficiary '{beneficiary.name}' is currently INACTIVE")

    # 1. Normalize and validate funding allocations
    raw_allocations = sad_in.funding_allocations
    if not raw_allocations:
        if sad_in.group_id:
            raw_allocations = [SadakahFundingAllocationCreate(group_id=sad_in.group_id, amount=sad_in.amount)]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one funding source group must be specified."
            )

    # Consolidate amounts if same group appears multiple times
    consolidated_allocs: Dict[int, Decimal] = {}
    for alloc in raw_allocations:
        if alloc.amount <= Decimal("0.00"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Each funding allocation must be strictly positive")
        consolidated_allocs[alloc.group_id] = consolidated_allocs.get(alloc.group_id, Decimal("0.00")) + alloc.amount

    # 2. Strict Exact Sum Validation
    total_allocated = sum(consolidated_allocs.values())
    if total_allocated != sad_in.amount:
        diff = abs(total_allocated - sad_in.amount)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total allocated funding (৳{total_allocated:,.2f}) does not match Sadaqah amount (৳{sad_in.amount:,.2f}). Difference: ৳{diff:,.2f}"
        )

    # 3. Row-level concurrency locking on Groups
    sorted_group_ids = sorted(list(consolidated_allocs.keys()))
    locked_groups = {
        g.id: g for g in db.query(Group).filter(Group.id.in_(sorted_group_ids)).with_for_update(of=Group).all()
    }

    # Verify each group exists, is active, and has sufficient available balance
    for gid, alloc_amt in consolidated_allocs.items():
        grp = locked_groups.get(gid)
        if not grp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Accounting Group #{gid} not found")
        if grp.status != "ACTIVE":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Group '{grp.name}' is INACTIVE")

        available_balance = AccountingService.get_group_current_balance(db, grp.id)
        if alloc_amt > available_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group '{grp.name}' ({grp.code}) does not have sufficient available funds. Requested: ৳{alloc_amt:,.2f}, Available: ৳{available_balance:,.2f}"
            )

    # 4. Generate unique serial Sadaqah identifier
    actual_date = sad_in.disbursement_date or TimezoneService.today(db)
    unique_code = uuid.uuid4().hex[:6].upper()
    s_num = f"SDQ-{actual_date.strftime('%Y%m%d')}-{unique_code}"
    primary_group_id = sorted_group_ids[0]

    # 5. Create Sadakah record
    sadakah = Sadakah(
        sadakah_number=s_num,
        group_id=primary_group_id,
        beneficiary_id=beneficiary.id,
        amount=sad_in.amount,
        disbursement_date=actual_date,
        payment_method=sad_in.payment_method,
        description=sad_in.description or "Direct humanitarian Sadaqah aid",
        reference=sad_in.reference,
        notes=sad_in.notes,
        created_by_id=current_user.id
    )
    db.add(sadakah)
    db.flush()

    # 6. Create Financial Transactions & Funding Allocations per group
    first_txn_id = None
    distribution_log = {}

    for gid, alloc_amt in consolidated_allocs.items():
        grp = locked_groups[gid]
        txn = AccountingService.create_transaction(
            db=db,
            group_id=grp.id,
            transaction_type="SADAKAH",
            flow_type="OUTFLOW",
            amount=alloc_amt,
            description=f"Sadaqah Aid to {beneficiary.name} ({beneficiary.beneficiary_number}) - {sad_in.description or s_num}",
            payment_method=sad_in.payment_method,
            reference=sad_in.reference,
            related_entity_type="beneficiary",
            related_entity_id=beneficiary.id,
            created_by_id=current_user.id,
            check_sufficient_funds=True
        )

        if first_txn_id is None:
            first_txn_id = txn.id

        fa = SadakahFundingAllocation(
            sadakah_id=sadakah.id,
            group_id=grp.id,
            allocated_amount=alloc_amt,
            transaction_id=txn.id
        )
        db.add(fa)
        distribution_log[grp.name] = str(alloc_amt)

    sadakah.transaction_id = first_txn_id

    # 7. Commit atomically
    db.commit()
    db.refresh(sadakah)

    # Invalidate cache for affected groups
    for gid in sorted_group_ids:
        cache.invalidate_financial_caches(gid)

    # 8. Audit logging
    AuditService.log(
        db, action="CREATE", module="sadakah", record_id=str(sadakah.id),
        user=current_user,
        new_values={
            "sadakah_number": sadakah.sadakah_number,
            "beneficiary": beneficiary.name,
            "amount": str(sadakah.amount),
            "funding_distribution": distribution_log,
            "payment_method": sadakah.payment_method
        }
    )
    db.commit()
    return sadakah
