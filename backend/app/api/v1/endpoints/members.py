import uuid
from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.member import Member
from backend.app.models.group import Group
from backend.app.models.contribution import Contribution
from backend.app.models.user import User
from backend.app.schemas.member import MemberResponse, MemberCreate, MemberUpdate
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


def generate_member_number(db: Session) -> str:
    count = db.query(Member).count() + 1
    return f"MEM-{count:04d}"


def populate_member_metrics(db: Session, member: Member) -> MemberResponse:
    total_paid = db.query(func.coalesce(func.sum(Contribution.amount), Decimal("0.00"))).filter(
        Contribution.member_id == member.id,
        Contribution.status == "PAID"
    ).scalar() or Decimal("0.00")

    pending_count = db.query(Contribution).filter(
        Contribution.member_id == member.id,
        Contribution.status.in_(["DUE", "CURRENT_PENDING"])
    ).count()

    resp = MemberResponse.model_validate(member)
    resp.total_contributions_paid = total_paid
    resp.pending_contributions_count = pending_count
    return resp


@router.get("", response_model=PaginatedResponse[MemberResponse])
def get_members(
    group_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.view"))
) -> Any:
    query = db.query(Member)

    if group_id:
        query = query.filter(Member.group_id == group_id)
    if status:
        query = query.filter(Member.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Member.full_name.ilike(s),
                Member.member_number.ilike(s),
                Member.phone.ilike(s),
                Member.email.ilike(s)
            )
        )

    total = query.count()
    items = query.order_by(Member.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [populate_member_metrics(db, m) for m in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.view"))
) -> Any:
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return populate_member_metrics(db, member)


@router.post("", response_model=MemberResponse)
def create_member(
    member_in: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.create"))
) -> Any:
    # 1. Enforce that member MUST belong to a Group
    group = db.query(Group).filter(Group.id == member_in.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned group does not exist. A member MUST belong to a valid Group.")

    member_num = member_in.member_number or generate_member_number(db)
    
    # Check uniqueness of member_number
    if db.query(Member).filter(Member.member_number == member_num).first():
        member_num = f"MEM-{uuid.uuid4().hex[:6].upper()}"

    member = Member(
        member_number=member_num,
        full_name=member_in.full_name,
        email=member_in.email,
        phone=member_in.phone,
        address=member_in.address,
        nid_or_id=member_in.nid_or_id,
        joining_date=member_in.joining_date,
        status=member_in.status,
        monthly_contribution_amount=member_in.monthly_contribution_amount,
        group_id=member_in.group_id,
        notes=member_in.notes
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    AuditService.log(
        db, action="CREATE", module="members", record_id=str(member.id),
        user=current_user, new_values={"name": member.full_name, "group_id": member.group_id, "monthly_amount": str(member.monthly_contribution_amount)}
    )
    db.commit()
    return populate_member_metrics(db, member)


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    member_in: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.update"))
) -> Any:
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    old_vals = {
        "full_name": member.full_name,
        "phone": member.phone,
        "group_id": member.group_id,
        "status": member.status,
        "monthly_amount": str(member.monthly_contribution_amount)
    }

    if member_in.group_id is not None:
        group = db.query(Group).filter(Group.id == member_in.group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned group does not exist.")
        member.group_id = member_in.group_id

    if member_in.full_name is not None:
        member.full_name = member_in.full_name
    if member_in.email is not None:
        member.email = member_in.email
    if member_in.phone is not None:
        member.phone = member_in.phone
    if member_in.address is not None:
        member.address = member_in.address
    if member_in.nid_or_id is not None:
        member.nid_or_id = member_in.nid_or_id
    if member_in.status is not None:
        member.status = member_in.status
    if member_in.monthly_contribution_amount is not None:
        member.monthly_contribution_amount = member_in.monthly_contribution_amount
    if member_in.notes is not None:
        member.notes = member_in.notes

    db.commit()
    db.refresh(member)

    AuditService.log(
        db, action="UPDATE", module="members", record_id=str(member.id),
        user=current_user, old_values=old_vals,
        new_values={
            "full_name": member.full_name,
            "group_id": member.group_id,
            "status": member.status,
            "monthly_amount": str(member.monthly_contribution_amount)
        }
    )
    db.commit()
    return populate_member_metrics(db, member)


@router.delete("/{member_id}")
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.delete"))
) -> Any:
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Check for linked financial contributions
    has_contributions = db.query(Contribution).filter(Contribution.member_id == member.id).first()
    if has_contributions:
        # Protect financial audit trail: Archive/Deactivate instead of hard deleting
        member.status = "INACTIVE"
        db.commit()
        AuditService.log(
            db, action="ARCHIVE", module="members", record_id=str(member.id),
            user=current_user, details=f"Member {member.member_number} ({member.full_name}) has financial records. Soft-archived and set to INACTIVE to preserve ledger audit trail."
        )
        db.commit()
        return {
            "success": True,
            "archived": True,
            "message": f"Member {member.member_number} has historical financial contributions. Safely archived and marked INACTIVE to preserve financial ledger integrity."
        }

    # If no financial contributions exist, safe to hard delete
    db.delete(member)
    db.commit()
    AuditService.log(
        db, action="DELETE", module="members", record_id=str(member_id),
        user=current_user, details=f"Member {member.member_number} ({member.full_name}) permanently deleted."
    )
    db.commit()
    return {"success": True, "archived": False, "message": f"Member {member.member_number} deleted successfully."}
