import uuid
from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.donor import Donor, Donation
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.schemas.donor import DonationResponse, DonationCreate
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[DonationResponse])
def get_donations(
    group_id: Optional[int] = None,
    donor_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donations.view"))
) -> Any:
    query = db.query(Donation)
    if group_id:
        query = query.filter(Donation.group_id == group_id)
    if donor_id:
        query = query.filter(Donation.donor_id == donor_id)

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


@router.post("", response_model=DonationResponse)
def record_donation(
    don_in: DonationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donations.create"))
) -> Any:
    # 1. Validate Group
    group = db.query(Group).filter(Group.id == don_in.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target Group does not exist")

    donor_name = "Anonymous Donor"
    if don_in.donor_id:
        donor = db.query(Donor).filter(Donor.id == don_in.donor_id).first()
        if not donor:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Donor does not exist")
        donor_name = f"{donor.name} ({donor.donor_number})"

    # 2. Create atomic Financial Transaction (INFLOW)
    txn = AccountingService.create_transaction(
        db=db,
        group_id=group.id,
        transaction_type="DONATION",
        flow_type="INFLOW",
        amount=don_in.amount,
        description=f"Donation from {donor_name}",
        payment_method=don_in.payment_method,
        reference=don_in.reference,
        related_entity_type="donor",
        related_entity_id=don_in.donor_id,
        created_by_id=current_user.id,
        check_sufficient_funds=False
    )

    unique_code = uuid.uuid4().hex[:6].upper()
    don_num = f"DON-{don_in.donation_date.strftime('%Y%m%d')}-{unique_code}"

    donation = Donation(
        donation_number=don_num,
        donor_id=don_in.donor_id,
        group_id=group.id,
        amount=don_in.amount,
        donation_date=don_in.donation_date,
        payment_method=don_in.payment_method,
        reference=don_in.reference,
        notes=don_in.notes,
        transaction_id=txn.id,
        created_by_id=current_user.id
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)

    cache.invalidate_financial_caches(group.id)
    AuditService.log(
        db, action="CREATE", module="donations", record_id=str(donation.id),
        user=current_user,
        new_values={
            "donation_number": donation.donation_number,
            "group": group.name,
            "amount": str(donation.amount),
            "donor": donor_name
        }
    )
    db.commit()
    return donation
