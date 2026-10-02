import uuid
from datetime import date
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
from backend.app.services.accounting_service import AccountingService
from backend.app.services.code_service import CodeService

router = APIRouter()


def generate_member_number(db: Session) -> str:
    return CodeService.process_member_code(db)


def populate_member_metrics(db: Session, member: Member, foundation_amount: Optional[Decimal] = None) -> MemberResponse:
    total_paid = db.query(func.coalesce(func.sum(Contribution.amount), Decimal("0.00"))).filter(
        Contribution.member_id == member.id,
        Contribution.status == "PAID"
    ).scalar() or Decimal("0.00")

    pending_count = db.query(Contribution).filter(
        Contribution.member_id == member.id,
        Contribution.status.in_(["DUE", "CURRENT_PENDING"])
    ).count()

    current_foundation_amount = foundation_amount if foundation_amount is not None else AccountingService.get_monthly_contribution_amount(db)

    resp = MemberResponse.model_validate(member)
    resp.monthly_contribution_amount = current_foundation_amount
    resp.foundation_monthly_amount = current_foundation_amount
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
    current_foundation_amount = AccountingService.get_monthly_contribution_amount(db)

    return {
        "items": [populate_member_metrics(db, m, current_foundation_amount) for m in items],
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
    if not member_in.full_name or not member_in.full_name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required.")

    # 1. Enforce that member MUST belong to a Group
    group = db.query(Group).filter(Group.id == member_in.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned group does not exist. A member MUST belong to a valid Group.")

    input_code = member_in.code or member_in.member_number
    member_num = CodeService.process_member_code(db, code=input_code)

    member = Member(
        member_number=member_num,
        full_name=member_in.full_name.strip(),
        group_id=member_in.group_id,
        status=member_in.status or "ACTIVE",
        joining_date=member_in.joining_date or date.today(),
        email=member_in.email,
        phone=member_in.phone,
        alternative_phone=member_in.alternative_phone,
        address=member_in.address,
        present_address=member_in.present_address,
        permanent_address=member_in.permanent_address,
        nid_or_id=member_in.nid_or_id,
        father_name=member_in.father_name,
        mother_name=member_in.mother_name,
        date_of_birth=member_in.date_of_birth,
        gender=member_in.gender,
        occupation=member_in.occupation,
        education=member_in.education,
        blood_group=member_in.blood_group,
        marital_status=member_in.marital_status,
        emergency_contact_name=member_in.emergency_contact_name,
        emergency_contact_relationship=member_in.emergency_contact_relationship,
        emergency_contact_phone=member_in.emergency_contact_phone,
        reference_name=member_in.reference_name,
        reference_phone=member_in.reference_phone,
        reference_relationship=member_in.reference_relationship,
        commitment=member_in.commitment,
        photo_url=member_in.photo_url,
        signature_url=member_in.signature_url,
        document_type=member_in.document_type,
        nid_front_url=member_in.nid_front_url,
        nid_back_url=member_in.nid_back_url,
        reason_for_joining=member_in.reason_for_joining,
        notes=member_in.notes
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    AuditService.log(
        db, action="CREATE", module="members", record_id=str(member.id),
        user=current_user, new_values={"name": member.full_name, "member_number": member.member_number, "group_id": member.group_id}
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
        "member_number": member.member_number,
        "full_name": member.full_name,
        "phone": member.phone,
        "group_id": member.group_id,
        "status": member.status
    }

    # Code update validation if provided
    input_code = member_in.code or member_in.member_number
    if input_code is not None and input_code.strip() and input_code.strip().upper() != member.member_number.upper():
        new_code = CodeService.process_member_code(db, code=input_code, exclude_id=member.id)
        member.member_number = new_code

    if member_in.group_id is not None:
        group = db.query(Group).filter(Group.id == member_in.group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned group does not exist.")
        member.group_id = member_in.group_id

    optional_fields = [
        "full_name", "email", "phone", "alternative_phone", "address", "present_address",
        "permanent_address", "nid_or_id", "father_name", "mother_name", "date_of_birth",
        "gender", "occupation", "education", "blood_group", "marital_status",
        "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone",
        "reference_name", "reference_phone", "reference_relationship",
        "commitment", "photo_url", "signature_url", "document_type",
        "nid_front_url", "nid_back_url", "reason_for_joining", "status", "notes", "joining_date"
    ]
    for field in optional_fields:
        val = getattr(member_in, field, None)
        if val is not None:
            setattr(member, field, val)

    db.commit()
    db.refresh(member)

    AuditService.log(
        db, action="UPDATE", module="members", record_id=str(member.id),
        user=current_user, old_values=old_vals,
        new_values={
            "member_number": member.member_number,
            "full_name": member.full_name,
            "group_id": member.group_id,
            "status": member.status
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
