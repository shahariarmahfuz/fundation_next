from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.donor import Donor, Donation
from backend.app.models.user import User
from backend.app.schemas.donor import DonorResponse, DonorCreate, DonorUpdate
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


def populate_donor_metrics(db: Session, donor: Donor) -> DonorResponse:
    total_donated = db.query(func.coalesce(func.sum(Donation.amount), Decimal("0.00"))).filter(
        Donation.donor_id == donor.id
    ).scalar() or Decimal("0.00")

    count = db.query(Donation).filter(Donation.donor_id == donor.id).count()

    resp = DonorResponse.model_validate(donor)
    resp.total_donations = total_donated
    resp.donation_count = count
    return resp


@router.get("", response_model=PaginatedResponse[DonorResponse])
def get_donors(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donors.view"))
) -> Any:
    query = db.query(Donor)
    if status:
        query = query.filter(Donor.status == status)

    total = query.count()
    items = query.order_by(Donor.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [populate_donor_metrics(db, d) for d in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{donor_id}", response_model=DonorResponse)
def get_donor(
    donor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donors.view"))
) -> Any:
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")
    return populate_donor_metrics(db, donor)


@router.post("", response_model=DonorResponse)
def create_donor(
    donor_in: DonorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donors.create"))
) -> Any:
    count = db.query(Donor).count() + 1
    d_num = f"DNR-{count:04d}"

    donor = Donor(
        donor_number=d_num,
        name=donor_in.name,
        phone=donor_in.phone,
        email=donor_in.email,
        address=donor_in.address,
        status=donor_in.status,
        notes=donor_in.notes
    )
    db.add(donor)
    db.commit()
    db.refresh(donor)

    AuditService.log(
        db, action="CREATE", module="donors", record_id=str(donor.id),
        user=current_user, new_values={"name": donor.name, "donor_number": donor.donor_number}
    )
    db.commit()
    return populate_donor_metrics(db, donor)


@router.put("/{donor_id}", response_model=DonorResponse)
def update_donor(
    donor_id: int,
    donor_in: DonorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donors.create"))
) -> Any:
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    if donor_in.name is not None:
        donor.name = donor_in.name
    if donor_in.phone is not None:
        donor.phone = donor_in.phone
    if donor_in.email is not None:
        donor.email = donor_in.email
    if donor_in.address is not None:
        donor.address = donor_in.address
    if donor_in.status is not None:
        donor.status = donor_in.status
    if donor_in.notes is not None:
        donor.notes = donor_in.notes

    db.commit()
    db.refresh(donor)
    return populate_donor_metrics(db, donor)
