import uuid
from datetime import date
from decimal import Decimal
from typing import List, Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.qard_hasan import (
    QardHasan,
    QardRepayment,
    QardHasanFundingAllocation,
    QardHasanRepaymentAllocation
)
from backend.app.models.beneficiary import Beneficiary
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.schemas.qard_hasan import (
    QardHasanResponse,
    QardHasanCreate,
    QardRepaymentResponse,
    QardRepaymentCreate,
    RepaymentPreviewResponse,
    RepaymentPreviewItem,
    QardHasanLedgerResponse,
    QardHasanLedgerItem,
    FundingAllocationResponse
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


def calculate_repayment_distribution(
    funding_allocations: List[QardHasanFundingAllocation],
    repayment_amount: Decimal
) -> List[tuple[QardHasanFundingAllocation, Decimal]]:
    """
    Proportionally allocates a repayment amount across the active funding allocations
    based on each source's remaining outstanding principal.
    Guarantees exact 0.00 BDT difference using the Largest Remainder Method in integer cents.
    """
    if repayment_amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Repayment amount must be strictly positive"
        )

    active_allocs = [fa for fa in funding_allocations if fa.outstanding_amount > Decimal("0.00")]
    if not active_allocs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Qard Hasan loan has no outstanding funding balance to repay."
        )

    total_outstanding = sum(fa.outstanding_amount for fa in active_allocs)
    if repayment_amount > total_outstanding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Repayment amount (৳{repayment_amount:,.2f}) exceeds total outstanding principal (৳{total_outstanding:,.2f})"
        )

    if repayment_amount == total_outstanding:
        # Exact full settlement
        return [(fa, fa.outstanding_amount) for fa in active_allocs]

    # Proportional Largest Remainder allocation in integer cents
    R_cents = int(round(repayment_amount * 100))
    T_rem_cents = sum(int(round(fa.outstanding_amount * 100)) for fa in active_allocs)

    shares = []
    total_base_cents = 0

    for fa in active_allocs:
        fa_rem_cents = int(round(fa.outstanding_amount * 100))
        exact_cents = (fa_rem_cents * R_cents) / T_rem_cents
        base_cents = int(exact_cents)  # floor
        remainder = exact_cents - base_cents
        shares.append({
            "fa": fa,
            "base_cents": base_cents,
            "remainder": remainder,
            "max_cents": fa_rem_cents,
            "final_cents": base_cents
        })
        total_base_cents += base_cents

    diff_cents = R_cents - total_base_cents
    # Sort allocations by remainder descending, then max_cents descending
    shares.sort(key=lambda s: (s["remainder"], s["max_cents"]), reverse=True)

    for i in range(diff_cents):
        shares[i % len(shares)]["final_cents"] += 1

    # Safety clamp: Ensure final_cents does not exceed max_cents
    overflow = 0
    for s in shares:
        if s["final_cents"] > s["max_cents"]:
            overflow += s["final_cents"] - s["max_cents"]
            s["final_cents"] = s["max_cents"]

    if overflow > 0:
        for s in shares:
            if overflow == 0:
                break
            cap = s["max_cents"] - s["final_cents"]
            add = min(cap, overflow)
            s["final_cents"] += add
            overflow -= add

    # Convert back to Decimal and verify exact sum
    distribution = []
    total_distributed = Decimal("0.00")
    for s in shares:
        amt = Decimal(s["final_cents"]) / Decimal("100")
        total_distributed += amt
        distribution.append((s["fa"], amt))

    if total_distributed != repayment_amount:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Repayment allocation rounding error: distributed ৳{total_distributed} vs requested ৳{repayment_amount}"
        )

    return distribution


@router.get("", response_model=PaginatedResponse[QardHasanResponse])
def get_qard_hasan_loans(
    group_id: Optional[int] = None,
    beneficiary_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("qard_hasan.view"))
) -> Any:
    query = db.query(QardHasan).join(Beneficiary, Beneficiary.id == QardHasan.beneficiary_id)

    if group_id:
        query = query.filter(
            or_(
                QardHasan.group_id == group_id,
                QardHasan.funding_allocations.any(QardHasanFundingAllocation.group_id == group_id)
            )
        )
    if beneficiary_id:
        query = query.filter(QardHasan.beneficiary_id == beneficiary_id)
    if status and status != "ALL":
        query = query.filter(QardHasan.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                QardHasan.qard_number.ilike(s),
                Beneficiary.name.ilike(s),
                Beneficiary.beneficiary_number.ilike(s),
                QardHasan.notes.ilike(s)
            )
        )

    total = query.count()
    items = query.order_by(QardHasan.disbursed_date.desc(), QardHasan.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/ledger", response_model=QardHasanLedgerResponse)
def get_qard_hasan_ledger(
    group_id: Optional[int] = None,
    beneficiary_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("qard_hasan.view"))
) -> Any:
    """
    Central Qard Hasan audit ledger with multi-group funding tracking,
    cumulative repayments, and remaining balances.
    """
    query = db.query(QardHasan).join(Beneficiary, Beneficiary.id == QardHasan.beneficiary_id)

    if group_id:
        query = query.filter(
            or_(
                QardHasan.group_id == group_id,
                QardHasan.funding_allocations.any(QardHasanFundingAllocation.group_id == group_id)
            )
        )
    if beneficiary_id:
        query = query.filter(QardHasan.beneficiary_id == beneficiary_id)
    if status and status != "ALL":
        query = query.filter(QardHasan.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                QardHasan.qard_number.ilike(s),
                Beneficiary.name.ilike(s),
                Beneficiary.beneficiary_number.ilike(s)
            )
        )

    # Compute overall summary
    summary_data = db.query(
        func.coalesce(func.sum(QardHasan.principal_amount), Decimal("0.00")).label("total_principal"),
        func.coalesce(func.sum(QardHasan.total_repaid), Decimal("0.00")).label("total_repaid"),
        func.coalesce(func.sum(QardHasan.outstanding_amount), Decimal("0.00")).label("total_outstanding"),
        func.count(QardHasan.id).label("total_count")
    ).first()

    active_count = db.query(QardHasan).filter(QardHasan.status.in_(["ACTIVE", "PARTIALLY_REPAID"])).count()
    completed_count = db.query(QardHasan).filter(QardHasan.status.in_(["COMPLETED", "FULLY_REPAID"])).count()

    total = query.count()
    items = query.order_by(QardHasan.disbursed_date.desc(), QardHasan.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    ledger_items = []
    for qh in items:
        funding_groups = []
        for fa in qh.funding_allocations:
            g_name = fa.group.name if fa.group else f"Group #{fa.group_id}"
            funding_groups.append(f"{g_name} (৳{fa.allocated_amount:,.2f})")

        ledger_items.append(QardHasanLedgerItem(
            id=qh.id,
            qard_number=qh.qard_number,
            beneficiary_id=qh.beneficiary_id,
            beneficiary_name=qh.beneficiary.name if qh.beneficiary else "Unknown",
            beneficiary_number=qh.beneficiary.beneficiary_number if qh.beneficiary else "",
            principal_amount=qh.principal_amount,
            monthly_repayment_amount=qh.monthly_repayment_amount,
            total_repaid=qh.total_repaid,
            outstanding_amount=qh.outstanding_amount,
            disbursed_date=qh.disbursed_date,
            status=qh.status,
            funding_groups=funding_groups,
            funding_allocations=[FundingAllocationResponse.model_validate(fa) for fa in qh.funding_allocations]
        ))

    summary = {
        "total_principal": str(summary_data.total_principal if summary_data else "0.00"),
        "total_repaid": str(summary_data.total_repaid if summary_data else "0.00"),
        "total_outstanding": str(summary_data.total_outstanding if summary_data else "0.00"),
        "total_count": total,
        "active_count": active_count,
        "completed_count": completed_count
    }

    return QardHasanLedgerResponse(
        items=ledger_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        summary=summary
    )


@router.get("/{qard_id}/repayment-preview", response_model=RepaymentPreviewResponse)
def get_repayment_preview(
    qard_id: int,
    amount: Decimal = Query(..., gt=Decimal("0.00")),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("qard_hasan.repayment"))
) -> Any:
    """
    Computes and previews the exact mathematical distribution of a prospective repayment
    across all funding groups before committing.
    """
    qh = db.query(QardHasan).filter(QardHasan.id == qard_id).first()
    if not qh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qard Hasan record not found")

    distribution = calculate_repayment_distribution(qh.funding_allocations, amount)

    preview_items = []
    total_allocated = Decimal("0.00")
    for fa, share in distribution:
        total_allocated += share
        preview_items.append(RepaymentPreviewItem(
            funding_allocation_id=fa.id,
            group_id=fa.group_id,
            group_name=fa.group.name if fa.group else f"Group #{fa.group_id}",
            group_code=fa.group.code if fa.group else None,
            original_allocated=fa.allocated_amount,
            already_repaid=fa.repaid_amount,
            current_outstanding=fa.outstanding_amount,
            repayment_share=share,
            new_outstanding=fa.outstanding_amount - share
        ))

    return RepaymentPreviewResponse(
        qard_hasan_id=qh.id,
        repayment_amount=amount,
        total_allocated=total_allocated,
        difference=amount - total_allocated,
        allocations=preview_items
    )


@router.get("/{qard_id}", response_model=QardHasanResponse)
def get_qard_hasan(
    qard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("qard_hasan.view"))
) -> Any:
    loan = db.query(QardHasan).filter(QardHasan.id == qard_id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qard Hasan record not found")
    return loan


@router.post("", response_model=QardHasanResponse)
def disburse_qard_hasan(
    qard_in: QardHasanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("qard_hasan.create"))
) -> Any:
    """
    Disburses an interest-free Qard Hasan loan funded by one or multiple groups.
    Enforces row-level concurrency locking and exact allocation validation inside an atomic transaction.
    """
    if qard_in.principal_amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Principal amount must be strictly positive")
    if qard_in.monthly_repayment_amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Monthly repayment amount must be strictly positive")

    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == qard_in.beneficiary_id).first()
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected Beneficiary does not exist")
    if beneficiary.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Beneficiary '{beneficiary.name}' is currently INACTIVE")

    # 1. Normalize and validate funding allocations
    raw_allocations = qard_in.funding_allocations
    if not raw_allocations:
        if qard_in.group_id:
            from backend.app.schemas.qard_hasan import FundingAllocationCreate
            raw_allocations = [FundingAllocationCreate(group_id=qard_in.group_id, amount=qard_in.principal_amount)]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one funding source group must be allocated."
            )

    # Consolidate amounts if same group appears multiple times
    consolidated_allocs: Dict[int, Decimal] = {}
    for alloc in raw_allocations:
        if alloc.amount <= Decimal("0.00"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Each funding allocation must be strictly positive")
        consolidated_allocs[alloc.group_id] = consolidated_allocs.get(alloc.group_id, Decimal("0.00")) + alloc.amount

    # 2. Strict Exact Principal Sum Validation
    total_allocated = sum(consolidated_allocs.values())
    if total_allocated != qard_in.principal_amount:
        diff = abs(total_allocated - qard_in.principal_amount)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total allocated funding (৳{total_allocated:,.2f}) does not match principal amount (৳{qard_in.principal_amount:,.2f}). Difference: ৳{diff:,.2f}"
        )

    # 3. Row-level concurrency locking on Groups
    sorted_group_ids = sorted(list(consolidated_allocs.keys()))
    locked_groups = {
        g.id: g for g in db.query(Group).filter(Group.id.in_(sorted_group_ids)).with_for_update(of=Group).all()
    }

    # Verify each group exists and has sufficient available balance
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

    # 4. Create Qard Hasan Record
    unique_code = uuid.uuid4().hex[:6].upper()
    q_num = f"QRD-{qard_in.disbursed_date.strftime('%Y%m%d')}-{unique_code}"
    primary_group_id = sorted_group_ids[0]

    qard = QardHasan(
        qard_number=q_num,
        group_id=primary_group_id,
        beneficiary_id=beneficiary.id,
        principal_amount=qard_in.principal_amount,
        monthly_repayment_amount=qard_in.monthly_repayment_amount,
        total_repaid=Decimal("0.00"),
        outstanding_amount=qard_in.principal_amount,
        disbursed_date=qard_in.disbursed_date,
        interest_rate=Decimal("0.00"),
        status="ACTIVE",
        repayment_schedule_notes=qard_in.repayment_schedule_notes,
        notes=qard_in.notes,
        created_by_id=current_user.id
    )
    db.add(qard)
    db.flush()

    # 5. Create Financial Transactions & Funding Allocations per group
    first_txn_id = None
    created_funding_allocs = []

    for gid, alloc_amt in consolidated_allocs.items():
        grp = locked_groups[gid]
        txn = AccountingService.create_transaction(
            db=db,
            group_id=grp.id,
            transaction_type="QARD_HASAN_DISBURSEMENT",
            flow_type="OUTFLOW",
            amount=alloc_amt,
            description=f"Qard Hasan Loan Disbursed to {beneficiary.name} ({beneficiary.beneficiary_number}) - {qard.qard_number}",
            payment_method=qard_in.payment_method or "CASH",
            reference=qard_in.reference,
            related_entity_type="beneficiary",
            related_entity_id=beneficiary.id,
            created_by_id=current_user.id,
            check_sufficient_funds=True
        )

        if first_txn_id is None:
            first_txn_id = txn.id

        fa = QardHasanFundingAllocation(
            qard_hasan_id=qard.id,
            group_id=grp.id,
            allocated_amount=alloc_amt,
            repaid_amount=Decimal("0.00"),
            outstanding_amount=alloc_amt,
            transaction_id=txn.id
        )
        db.add(fa)
        created_funding_allocs.append(fa)

    qard.disbursement_transaction_id = first_txn_id
    db.commit()
    db.refresh(qard)

    for gid in sorted_group_ids:
        cache.invalidate_financial_caches(gid)

    AuditService.log(
        db, action="CREATE", module="qard_hasan", record_id=str(qard.id),
        user=current_user,
        new_values={
            "qard_number": qard.qard_number,
            "beneficiary": beneficiary.name,
            "principal": str(qard.principal_amount),
            "groups_count": len(consolidated_allocs),
            "funding_distribution": {locked_groups[gid].name: str(amt) for gid, amt in consolidated_allocs.items()}
        }
    )
    db.commit()
    return qard


@router.post("/repayments", response_model=QardRepaymentResponse)
def record_qard_repayment(
    rep_in: QardRepaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("qard_hasan.repayment"))
) -> Any:
    """
    Records an interest-free Qard Hasan repayment.
    Atomically allocates returned funds back to the original funding groups proportional
    to their outstanding principal, guaranteeing 0.00 BDT rounding discrepancy.
    """
    if rep_in.amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Repayment amount must be strictly positive")

    # 1. Lock Qard Hasan row
    qard = db.query(QardHasan).filter(QardHasan.id == rep_in.qard_hasan_id).with_for_update(of=QardHasan).first()
    if not qard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qard Hasan record not found")
    if qard.status in ["COMPLETED", "FULLY_REPAID"] or qard.outstanding_amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Qard Hasan loan is already fully settled")

    # 2. Prevent overpayment
    if rep_in.amount > qard.outstanding_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Repayment amount (৳{rep_in.amount:,.2f}) exceeds outstanding loan balance (৳{qard.outstanding_amount:,.2f})"
        )

    # 3. Calculate exact distribution across funding allocations
    distribution = calculate_repayment_distribution(qard.funding_allocations, rep_in.amount)

    beneficiary = qard.beneficiary
    unique_code = uuid.uuid4().hex[:6].upper()
    r_num = f"REP-{rep_in.repayment_date.strftime('%Y%m%d')}-{unique_code}"

    # Lock groups
    group_ids = sorted(list({fa.group_id for fa, _ in distribution}))
    locked_groups = {
        g.id: g for g in db.query(Group).filter(Group.id.in_(group_ids)).with_for_update(of=Group).all()
    }

    primary_group_id = group_ids[0] if group_ids else qard.group_id

    # 4. Create QardRepayment record
    repayment = QardRepayment(
        repayment_number=r_num,
        qard_hasan_id=qard.id,
        group_id=primary_group_id,
        beneficiary_id=beneficiary.id,
        amount=rep_in.amount,
        repayment_date=rep_in.repayment_date,
        payment_method=rep_in.payment_method,
        reference=rep_in.reference,
        notes=rep_in.notes,
        created_by_id=current_user.id
    )
    db.add(repayment)
    db.flush()

    first_txn_id = None
    distribution_log = {}

    # 5. Create Financial Transactions & Repayment Allocations for each funding group
    for fa, share in distribution:
        grp = locked_groups[fa.group_id]
        txn = AccountingService.create_transaction(
            db=db,
            group_id=grp.id,
            transaction_type="QARD_HASAN_REPAYMENT",
            flow_type="INFLOW",
            amount=share,
            description=f"Qard Hasan Repayment on {qard.qard_number} from {beneficiary.name} ({beneficiary.beneficiary_number})",
            payment_method=rep_in.payment_method,
            reference=rep_in.reference,
            related_entity_type="beneficiary",
            related_entity_id=beneficiary.id,
            created_by_id=current_user.id,
            check_sufficient_funds=False
        )

        if first_txn_id is None:
            first_txn_id = txn.id

        rep_alloc = QardHasanRepaymentAllocation(
            repayment_id=repayment.id,
            funding_allocation_id=fa.id,
            group_id=grp.id,
            allocated_amount=share,
            transaction_id=txn.id
        )
        db.add(rep_alloc)

        # Update funding allocation balance
        fa.repaid_amount += share
        fa.outstanding_amount -= share

        distribution_log[grp.name] = str(share)

    repayment.transaction_id = first_txn_id

    # 6. Update overall Qard Hasan balance & status
    qard.total_repaid += rep_in.amount
    qard.outstanding_amount -= rep_in.amount
    if qard.outstanding_amount == Decimal("0.00"):
        qard.status = "COMPLETED"
    else:
        qard.status = "ACTIVE"

    db.commit()
    db.refresh(repayment)
    db.refresh(qard)

    for gid in group_ids:
        cache.invalidate_financial_caches(gid)

    AuditService.log(
        db, action="CREATE", module="qard_repayments", record_id=str(repayment.id),
        user=current_user,
        new_values={
            "repayment_number": repayment.repayment_number,
            "qard_number": qard.qard_number,
            "amount": str(repayment.amount),
            "remaining_outstanding": str(qard.outstanding_amount),
            "status": qard.status,
            "distribution": distribution_log
        }
    )
    db.commit()
    return repayment
