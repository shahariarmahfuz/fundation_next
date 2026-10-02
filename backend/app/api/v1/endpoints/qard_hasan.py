import uuid
from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.qard_hasan import QardHasan, QardRepayment
from backend.app.models.beneficiary import Beneficiary
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.schemas.qard_hasan import (
    QardHasanResponse,
    QardHasanCreate,
    QardRepaymentResponse,
    QardRepaymentCreate
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[QardHasanResponse])
def get_qard_hasan_loans(
    group_id: Optional[int] = None,
    beneficiary_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("qard_hasan.view"))
) -> Any:
    query = db.query(QardHasan)
    if group_id:
        query = query.filter(QardHasan.group_id == group_id)
    if beneficiary_id:
        query = query.filter(QardHasan.beneficiary_id == beneficiary_id)
    if status:
        query = query.filter(QardHasan.status == status)

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
    Disburses an interest-free Qard Hasan loan.
    Verifies available group balance, deducts from group, and creates outstanding receivable.
    """
    if qard_in.principal_amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Principal amount must be positive")
    if qard_in.monthly_repayment_amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Monthly repayment amount must be positive")

    group = db.query(Group).filter(Group.id == qard_in.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected Group does not exist")

    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == qard_in.beneficiary_id).first()
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected Beneficiary does not exist")

    # 1. Atomic Financial Transaction: OUTFLOW from selected group
    txn = AccountingService.create_transaction(
        db=db,
        group_id=group.id,
        transaction_type="QARD_HASAN_DISBURSEMENT",
        flow_type="OUTFLOW",
        amount=qard_in.principal_amount,
        description=f"Qard Hasan Loan Disbursed to {beneficiary.name} ({beneficiary.beneficiary_number})",
        related_entity_type="beneficiary",
        related_entity_id=beneficiary.id,
        created_by_id=current_user.id,
        check_sufficient_funds=True
    )

    unique_code = uuid.uuid4().hex[:6].upper()
    q_num = f"QRD-{qard_in.disbursed_date.strftime('%Y%m%d')}-{unique_code}"

    qard = QardHasan(
        qard_number=q_num,
        group_id=group.id,
        beneficiary_id=beneficiary.id,
        principal_amount=qard_in.principal_amount,
        monthly_repayment_amount=qard_in.monthly_repayment_amount,
        total_repaid=Decimal("0.00"),
        outstanding_amount=qard_in.principal_amount,
        disbursed_date=qard_in.disbursed_date,
        interest_rate=Decimal("0.00"),  # Strictly zero
        status="ACTIVE",
        repayment_schedule_notes=qard_in.repayment_schedule_notes,
        notes=qard_in.notes,
        disbursement_transaction_id=txn.id,
        created_by_id=current_user.id
    )
    db.add(qard)
    db.commit()
    db.refresh(qard)

    cache.invalidate_financial_caches(group.id)
    AuditService.log(
        db, action="CREATE", module="qard_hasan", record_id=str(qard.id),
        user=current_user,
        new_values={
            "qard_number": qard.qard_number,
            "beneficiary": beneficiary.name,
            "group": group.name,
            "principal": str(qard.principal_amount)
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
    Returns money to the original Group (increasing Group balance) and reduces outstanding receivable.
    Prevents overpayment.
    """
    if rep_in.amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Repayment amount must be strictly positive")

    qard = db.query(QardHasan).filter(QardHasan.id == rep_in.qard_hasan_id).first()
    if not qard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qard Hasan record not found")
    if qard.status == "COMPLETED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Qard Hasan loan is already fully repaid")

    # Prevent overpayment
    if rep_in.amount > qard.outstanding_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Repayment amount (৳{rep_in.amount:,.2f}) exceeds outstanding principal (৳{qard.outstanding_amount:,.2f})"
        )

    beneficiary = qard.beneficiary
    group = qard.group

    # 1. Atomic Financial Transaction: INFLOW into the original group
    txn = AccountingService.create_transaction(
        db=db,
        group_id=group.id,
        transaction_type="QARD_HASAN_REPAYMENT",
        flow_type="INFLOW",
        amount=rep_in.amount,
        description=f"Qard Hasan Repayment from {beneficiary.name} for {qard.qard_number}",
        payment_method=rep_in.payment_method,
        reference=rep_in.reference,
        related_entity_type="beneficiary",
        related_entity_id=beneficiary.id,
        created_by_id=current_user.id,
        check_sufficient_funds=False
    )

    # 2. Update Qard Hasan state
    qard.total_repaid += rep_in.amount
    qard.outstanding_amount -= rep_in.amount
    if qard.outstanding_amount == Decimal("0.00"):
        qard.status = "COMPLETED"

    unique_code = uuid.uuid4().hex[:6].upper()
    r_num = f"REP-{rep_in.repayment_date.strftime('%Y%m%d')}-{unique_code}"

    repayment = QardRepayment(
        repayment_number=r_num,
        qard_hasan_id=qard.id,
        group_id=group.id,
        beneficiary_id=beneficiary.id,
        amount=rep_in.amount,
        repayment_date=rep_in.repayment_date,
        payment_method=rep_in.payment_method,
        reference=rep_in.reference,
        notes=rep_in.notes,
        transaction_id=txn.id,
        created_by_id=current_user.id
    )
    db.add(repayment)
    db.commit()
    db.refresh(repayment)

    cache.invalidate_financial_caches(group.id)
    AuditService.log(
        db, action="CREATE", module="qard_repayments", record_id=str(repayment.id),
        user=current_user,
        new_values={
            "repayment_number": repayment.repayment_number,
            "qard_number": qard.qard_number,
            "amount": str(repayment.amount),
            "remaining_outstanding": str(qard.outstanding_amount),
            "status": qard.status
        }
    )
    db.commit()
    return repayment
