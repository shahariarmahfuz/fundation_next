from decimal import Decimal
from typing import List, Any, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.donor import Donor, Donation
from backend.app.models.member import Member
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
    member_id: Optional[int] = None,
    source_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("donations.view"))
) -> Any:
    query = db.query(Donation).options(
        joinedload(Donation.donor),
        joinedload(Donation.member),
        joinedload(Donation.group),
        joinedload(Donation.transaction)
    )

    if group_id:
        query = query.filter(Donation.group_id == group_id)
    if donor_id:
        query = query.filter(Donation.donor_id == donor_id)
    if member_id:
        query = query.filter(Donation.member_id == member_id)
    if source_type:
        query = query.filter(Donation.source_type == source_type.upper())
    if search:
        search_term = f"%{search.strip()}%"
        query = query.outerjoin(Donation.donor).outerjoin(Donation.member).filter(
            or_(
                Donation.donation_number.ilike(search_term),
                Donation.reference.ilike(search_term),
                Donor.name.ilike(search_term),
                Donor.donor_number.ilike(search_term),
                Member.full_name.ilike(search_term),
                Member.member_number.ilike(search_term)
            )
        )

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
    # 1. Validate Target Accounting Group
    group = db.query(Group).filter(Group.id == don_in.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Destination Accounting Group does not exist")

    # 2. Validate Source Entity based on source_type
    source_type = (don_in.source_type or "DONOR").upper()
    if source_type == "MEMBER":
        if not don_in.member_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="member_id is required when source_type is MEMBER")
        member = db.query(Member).filter(Member.id == don_in.member_id).first()
        if not member:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected Member does not exist")
        source_name = f"{member.full_name} ({member.member_number})"
        related_entity_type = "member"
        related_entity_id = member.id
        effective_donor_id = None
        effective_member_id = member.id
    elif source_type == "DONOR":
        if not don_in.donor_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="donor_id is required when source_type is DONOR")
        donor = db.query(Donor).filter(Donor.id == don_in.donor_id).first()
        if not donor:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected Donor does not exist")
        source_name = f"{donor.name} ({donor.donor_number})"
        related_entity_type = "donor"
        related_entity_id = donor.id
        effective_donor_id = donor.id
        effective_member_id = None
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid source_type. Must be 'DONOR' or 'MEMBER'")

    # 3. Create atomic Financial Transaction (INFLOW to Group)
    try:
        txn = AccountingService.create_transaction(
            db=db,
            group_id=group.id,
            transaction_type="DONATION",
            flow_type="INFLOW",
            amount=don_in.amount,
            description=f"Donation from {source_type.title()}: {source_name}",
            payment_method=don_in.payment_method,
            reference=don_in.reference,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            created_by_id=current_user.id,
            check_sufficient_funds=False
        )

        unique_code = uuid.uuid4().hex[:6].upper()
        don_num = f"DON-{don_in.donation_date.strftime('%Y%m%d')}-{unique_code}"

        donation = Donation(
            donation_number=don_num,
            source_type=source_type,
            donor_id=effective_donor_id,
            member_id=effective_member_id,
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
                "source_type": source_type,
                "group": group.name,
                "amount": str(donation.amount),
                "source": source_name
            }
        )
        db.commit()
        return donation
    except Exception as exc:
        db.rollback()
        raise exc
