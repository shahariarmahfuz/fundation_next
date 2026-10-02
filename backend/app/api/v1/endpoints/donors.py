from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from backend.app.core.database import get_db
from backend.app.models.donor import Donor, Donation
from backend.app.models.user import User
from backend.app.schemas.donor import DonorResponse, DonorCreate, DonorUpdate, DonationResponse
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
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donors.view"))
) -> Any:
    query = db.query(Donor)
    if status:
        query = query.filter(Donor.status == status.upper())
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Donor.name.ilike(search_term),
                Donor.donor_number.ilike(search_term),
                Donor.phone.ilike(search_term),
                Donor.email.ilike(search_term),
                Donor.address.ilike(search_term)
            )
        )

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


@router.get("/{donor_id}/donations", response_model=PaginatedResponse[DonationResponse])
def get_donor_donations(
    donor_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donors.view"))
) -> Any:
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    query = db.query(Donation).options(
        joinedload(Donation.donor),
        joinedload(Donation.group),
        joinedload(Donation.transaction)
    ).filter(Donation.donor_id == donor.id)

    total = query.count()
    items = query.order_by(Donation.donation_date.desc(), Donation.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.post("", response_model=DonorResponse)
def create_donor(
    donor_in: DonorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donors.create"))
) -> Any:
    provided_code = (donor_in.donor_number or donor_in.code or "").strip()
    if provided_code:
        # Check uniqueness
        existing = db.query(Donor).filter(Donor.donor_number == provided_code).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Donor ID '{provided_code}' already exists")
        d_num = provided_code
    else:
        max_id = db.query(func.max(Donor.id)).scalar() or 0
        d_num = f"DNR-{max_id + 1:04d}"

    donor = Donor(
        donor_number=d_num,
        name=donor_in.name,
        phone=donor_in.phone,
        email=donor_in.email,
        address=donor_in.address,
        status=donor_in.status or "ACTIVE",
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

    provided_code = (donor_in.donor_number or donor_in.code)
    if provided_code is not None and provided_code.strip() != "":
        code_str = provided_code.strip()
        if code_str != donor.donor_number:
            existing = db.query(Donor).filter(Donor.donor_number == code_str, Donor.id != donor_id).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Donor ID '{code_str}' already in use")
            donor.donor_number = code_str

    if donor_in.name is not None:
        donor.name = donor_in.name
    if donor_in.phone is not None:
        donor.phone = donor_in.phone
    if donor_in.email is not None:
        donor.email = donor_in.email
    if donor_in.address is not None:
        donor.address = donor_in.address
    if donor_in.status is not None:
        donor.status = donor_in.status.upper()
    if donor_in.notes is not None:
        donor.notes = donor_in.notes

    db.commit()
    db.refresh(donor)
    return populate_donor_metrics(db, donor)


@router.delete("/{donor_id}")
def delete_donor(
    donor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donors.create"))
) -> Any:
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    # Protection: check if donor has donations
    donation_count = db.query(Donation).filter(Donation.donor_id == donor.id).count()
    if donation_count > 0:
        donor.status = "INACTIVE"
        db.commit()
        return {
            "success": True,
            "archived": True,
            "message": f"Donor has {donation_count} recorded donation(s). Donor was safely marked INACTIVE to preserve audit trail."
        }

    db.delete(donor)
    db.commit()
    return {"success": True, "archived": False, "message": "Donor deleted successfully"}
