import uuid
from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.sadakah import Sadakah
from backend.app.models.beneficiary import Beneficiary
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.schemas.sadakah import SadakahResponse, SadakahCreate
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[SadakahResponse])
def get_sadakah_grants(
    group_id: Optional[int] = None,
    beneficiary_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sadakah.view"))
) -> Any:
    query = db.query(Sadakah)
    if group_id:
        query = query.filter(Sadakah.group_id == group_id)
    if beneficiary_id:
        query = query.filter(Sadakah.beneficiary_id == beneficiary_id)

    total = query.count()
    items = query.order_by(Sadakah.disbursement_date.desc(), Sadakah.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.post("", response_model=SadakahResponse)
def disburse_sadakah(
    sad_in: SadakahCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sadakah.create"))
) -> Any:
    """
    Disburses non-repayable Sadakah assistance from a designated financial group.
    Permanently reduces the group balance. No receivable is created.
    """
    if sad_in.amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")

    group = db.query(Group).filter(Group.id == sad_in.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected Group does not exist")

    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == sad_in.beneficiary_id).first()
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected Beneficiary does not exist")

    # 1. Atomic Financial Transaction: OUTFLOW from group
    txn = AccountingService.create_transaction(
        db=db,
        group_id=group.id,
        transaction_type="SADAKAH",
        flow_type="OUTFLOW",
        amount=sad_in.amount,
        description=f"Sadakah Grant to {beneficiary.name}: {sad_in.description}",
        payment_method=sad_in.payment_method,
        reference=sad_in.reference,
        related_entity_type="beneficiary",
        related_entity_id=beneficiary.id,
        created_by_id=current_user.id,
        check_sufficient_funds=True
    )

    unique_code = uuid.uuid4().hex[:6].upper()
    s_num = f"SDK-{sad_in.disbursement_date.strftime('%Y%m%d')}-{unique_code}"

    sadakah = Sadakah(
        sadakah_number=s_num,
        group_id=group.id,
        beneficiary_id=beneficiary.id,
        amount=sad_in.amount,
        disbursement_date=sad_in.disbursement_date,
        payment_method=sad_in.payment_method,
        description=sad_in.description,
        reference=sad_in.reference,
        notes=sad_in.notes,
        transaction_id=txn.id,
        created_by_id=current_user.id
    )
    db.add(sadakah)
    db.commit()
    db.refresh(sadakah)

    cache.invalidate_financial_caches(group.id)
    AuditService.log(
        db, action="CREATE", module="sadakah", record_id=str(sadakah.id),
        user=current_user,
        new_values={
            "sadakah_number": sadakah.sadakah_number,
            "beneficiary": beneficiary.name,
            "group": group.name,
            "amount": str(sadakah.amount)
        }
    )
    db.commit()
    return sadakah
