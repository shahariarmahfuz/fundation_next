from decimal import Decimal
from typing import List, Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.beneficiary import Beneficiary
from backend.app.models.qard_hasan import QardHasan, QardRepayment
from backend.app.models.sadakah import Sadakah
from backend.app.models.user import User
from backend.app.schemas.beneficiary import BeneficiaryResponse, BeneficiaryCreate, BeneficiaryUpdate
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


def populate_beneficiary_metrics(db: Session, b: Beneficiary) -> BeneficiaryResponse:
    qard_stats = db.query(
        func.coalesce(func.sum(QardHasan.principal_amount), Decimal("0.00")).label("principal"),
        func.coalesce(func.sum(QardHasan.total_repaid), Decimal("0.00")).label("repaid"),
        func.coalesce(func.sum(QardHasan.outstanding_amount), Decimal("0.00")).label("outstanding")
    ).filter(QardHasan.beneficiary_id == b.id).first()

    sadakah_total = db.query(func.coalesce(func.sum(Sadakah.amount), Decimal("0.00"))).filter(
        Sadakah.beneficiary_id == b.id
    ).scalar() or Decimal("0.00")

    resp = BeneficiaryResponse.model_validate(b)
    resp.total_qard_received = qard_stats.principal if qard_stats else Decimal("0.00")
    resp.total_qard_repaid = qard_stats.repaid if qard_stats else Decimal("0.00")
    resp.total_qard_outstanding = qard_stats.outstanding if qard_stats else Decimal("0.00")
    resp.total_sadakah_received = sadakah_total
    return resp


@router.get("", response_model=PaginatedResponse[BeneficiaryResponse])
def get_beneficiaries(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.view"))
) -> Any:
    query = db.query(Beneficiary)
    if status:
        query = query.filter(Beneficiary.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Beneficiary.name.ilike(s),
                Beneficiary.beneficiary_number.ilike(s),
                Beneficiary.phone.ilike(s)
            )
        )

    total = query.count()
    items = query.order_by(Beneficiary.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [populate_beneficiary_metrics(db, b) for b in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{beneficiary_id}", response_model=BeneficiaryResponse)
def get_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.view"))
) -> Any:
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    return populate_beneficiary_metrics(db, b)


@router.get("/{beneficiary_id}/assistance-history")
def get_beneficiary_history(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.view"))
) -> Any:
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    qards = db.query(QardHasan).filter(QardHasan.beneficiary_id == b.id).all()
    repayments = db.query(QardRepayment).filter(QardRepayment.beneficiary_id == b.id).all()
    sadakahs = db.query(Sadakah).filter(Sadakah.beneficiary_id == b.id).all()

    return {
        "beneficiary": populate_beneficiary_metrics(db, b),
        "qard_hasan_loans": qards,
        "qard_repayments": repayments,
        "sadakah_grants": sadakahs
    }


@router.post("", response_model=BeneficiaryResponse)
def create_beneficiary(
    ben_in: BeneficiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.create"))
) -> Any:
    count = db.query(Beneficiary).count() + 1
    b_num = f"BEN-{count:04d}"

    b = Beneficiary(
        beneficiary_number=b_num,
        name=ben_in.name,
        phone=ben_in.phone,
        email=ben_in.email,
        address=ben_in.address,
        nid_or_id=ben_in.nid_or_id,
        status=ben_in.status,
        notes=ben_in.notes
    )
    db.add(b)
    db.commit()
    db.refresh(b)

    AuditService.log(
        db, action="CREATE", module="beneficiaries", record_id=str(b.id),
        user=current_user, new_values={"name": b.name, "beneficiary_number": b.beneficiary_number}
    )
    db.commit()
    return populate_beneficiary_metrics(db, b)


@router.put("/{beneficiary_id}", response_model=BeneficiaryResponse)
def update_beneficiary(
    beneficiary_id: int,
    ben_in: BeneficiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.update"))
) -> Any:
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    if ben_in.name is not None:
        b.name = ben_in.name
    if ben_in.phone is not None:
        b.phone = ben_in.phone
    if ben_in.email is not None:
        b.email = ben_in.email
    if ben_in.address is not None:
        b.address = ben_in.address
    if ben_in.nid_or_id is not None:
        b.nid_or_id = ben_in.nid_or_id
    if ben_in.status is not None:
        b.status = ben_in.status
    if ben_in.notes is not None:
        b.notes = ben_in.notes

    db.commit()
    db.refresh(b)
    return populate_beneficiary_metrics(db, b)
