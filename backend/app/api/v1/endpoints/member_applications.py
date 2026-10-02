import uuid
from datetime import datetime, timezone
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.member_application import MemberApplication
from backend.app.models.member import Member
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.schemas.member_application import (
    MemberApplicationCreate,
    MemberApplicationReview,
    MemberApplicationResponse
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.post("", response_model=MemberApplicationResponse)
def submit_member_application(
    app_in: MemberApplicationCreate,
    db: Session = Depends(get_db)
) -> Any:
    """Public endpoint for prospective members to apply."""
    app = MemberApplication(
        applicant_name=app_in.applicant_name,
        email=app_in.email,
        phone=app_in.phone,
        address=app_in.address,
        nid_or_id=app_in.nid_or_id,
        proposed_contribution=app_in.proposed_contribution,
        reason_for_joining=app_in.reason_for_joining,
        status="PENDING"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("", response_model=PaginatedResponse[MemberApplicationResponse])
def get_member_applications(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.view"))
) -> Any:
    query = db.query(MemberApplication)
    if status:
        query = query.filter(MemberApplication.status == status)

    total = query.count()
    items = query.order_by(MemberApplication.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{app_id}", response_model=MemberApplicationResponse)
def get_member_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.view"))
) -> Any:
    app = db.query(MemberApplication).filter(MemberApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


@router.post("/{app_id}/review", response_model=MemberApplicationResponse)
def review_member_application(
    app_id: int,
    review_in: MemberApplicationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.create"))
) -> Any:
    app = db.query(MemberApplication).filter(MemberApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if app.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application has already been processed")

    app.reviewed_by_id = current_user.id
    app.reviewed_at = datetime.now(timezone.utc)
    app.review_notes = review_in.review_notes

    if review_in.action.upper() == "APPROVE":
        if not review_in.assigned_group_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned group is required to approve member application. A member must belong to a group."
            )
        
        group = db.query(Group).filter(Group.id == review_in.assigned_group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned group not found")

        # Generate unique member number
        count = db.query(Member).count() + 1
        member_num = f"MEM-{count:04d}"

        new_member = Member(
            member_number=member_num,
            full_name=app.applicant_name,
            email=app.email,
            phone=app.phone,
            address=app.address,
            nid_or_id=app.nid_or_id,
            status="ACTIVE",
            monthly_contribution_amount=app.proposed_contribution,
            group_id=group.id,
            notes=f"Approved from online application #{app.id}. {review_in.review_notes or ''}"
        )
        db.add(new_member)
        db.flush()

        app.status = "APPROVED"
        app.assigned_group_id = group.id
        app.created_member_id = new_member.id

        AuditService.log(
            db, action="APPROVE", module="member_applications", record_id=str(app.id),
            user=current_user, details=f"Approved member application. Created Member {new_member.member_number} in Group {group.name}"
        )

    elif review_in.action.upper() == "REJECT":
        app.status = "REJECTED"
        AuditService.log(
            db, action="REJECT", module="member_applications", record_id=str(app.id),
            user=current_user, details=f"Rejected member application. Reason: {review_in.review_notes}"
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action. Must be APPROVE or REJECT")

    db.commit()
    db.refresh(app)
    return app
