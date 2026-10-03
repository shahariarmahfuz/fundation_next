import uuid
from datetime import datetime, timezone
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from sqlalchemy import text, func

from backend.app.core.database import get_db
from backend.app.models.member_application import MemberApplication
from backend.app.models.member import Member
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.schemas.member_application import (
    MemberApplicationCreate,
    MemberApplicationReview,
    MemberApplicationResponse,
    PublicApplicationStatusResponse,
    PublicGroupOption
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


def generate_request_id(db: Session) -> str:
    """Generates next sequential, public-safe request ID (e.g. REQ-000016)."""
    bind = db.get_bind()
    if bind.dialect.name == "postgresql":
        try:
            val = db.execute(text("SELECT nextval('application_request_seq')")).scalar()
            return f"REQ-{val:06d}"
        except Exception:
            db.rollback()
    max_id = db.query(func.coalesce(func.max(MemberApplication.id), 0)).scalar() or 0
    return f"REQ-{max_id + 1:06d}"


@router.get("/groups", response_model=List[PublicGroupOption])
def get_public_application_groups(db: Session = Depends(get_db)) -> Any:
    """Public endpoint to list active groups available for prospective member selection."""
    return db.query(Group).filter(Group.status == "ACTIVE").order_by(Group.name).all()


@router.get("/status/{request_id}", response_model=PublicApplicationStatusResponse)
def get_public_application_status(
    request_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """Public safe endpoint to track application status without exposing private data."""
    req_clean = request_id.strip()
    app = db.query(MemberApplication).filter(
        func.upper(MemberApplication.request_id) == req_clean.upper()
    ).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found for the provided Request ID."
        )

    # Safe public group name
    group_name = "General Group"
    if app.group:
        group_name = app.group.name
    elif app.assigned_group:
        group_name = app.assigned_group.name

    # Member ID only exposed upon approval
    member_code = None
    if app.status == "APPROVED":
        if app.created_member and app.created_member.member_number:
            member_code = app.created_member.member_number
        elif app.member and app.member.member_number:
            member_code = app.member.member_number
        elif app.created_member_id or app.member_id:
            m_id = app.created_member_id or app.member_id
            m = db.query(Member).filter(Member.id == m_id).first()
            if m:
                member_code = m.member_number

    # Rejection reason only exposed upon rejection
    rejection_reason = None
    if app.status == "REJECTED":
        rejection_reason = app.rejection_reason or app.review_notes or "Application was not approved."

    submitted_date_str = app.created_at.strftime("%d %B %Y") if app.created_at else ""

    return {
        "request_id": app.request_id,
        "applicant_name": app.applicant_name,
        "group_name": group_name,
        "status": app.status,
        "submitted_date": submitted_date_str,
        "member_id": member_code,
        "rejection_reason": rejection_reason,
    }


@router.post("", response_model=MemberApplicationResponse)
def submit_member_application(
    app_in: MemberApplicationCreate,
    db: Session = Depends(get_db)
) -> Any:
    """Public endpoint for prospective members to apply with Full Name and Group."""
    full_name = (app_in.full_name or app_in.applicant_name or "").strip()
    if not full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full Name is required"
        )

    if not app_in.group_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group selection is required"
        )

    group = db.query(Group).filter(Group.id == app_in.group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected Group does not exist"
        )

    req_id = generate_request_id(db)

    app = MemberApplication(
        request_id=req_id,
        applicant_name=full_name,
        group_id=group.id,
        assigned_group_id=group.id,
        status="PENDING",
        email=app_in.email,
        phone=app_in.phone,
        address=app_in.address,
        nid_or_id=app_in.nid_or_id,
        proposed_contribution=app_in.proposed_contribution,
        reason_for_joining=app_in.reason_for_joining,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("", response_model=PaginatedResponse[MemberApplicationResponse])
def get_member_applications(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
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
        target_group_id = review_in.assigned_group_id or app.group_id or app.assigned_group_id
        if not target_group_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned group is required to approve member application. A member must belong to a group."
            )
        
        group = db.query(Group).filter(Group.id == target_group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned group not found")

        # Concurrency-safe unique member code generation (e.g. M-0001, M-0002, etc.)
        from backend.app.services.code_service import CodeService
        member_num = CodeService.process_member_code(db)

        new_member = Member(
            member_number=member_num,
            full_name=app.applicant_name,
            email=app.email,
            phone=app.phone or "",
            address=app.address,
            nid_or_id=app.nid_or_id,
            status="ACTIVE",
            group_id=group.id,
            notes=f"Approved from public application #{app.id}. {review_in.review_notes or ''}".strip()
        )
        db.add(new_member)
        db.flush()

        app.status = "APPROVED"
        app.approved_at = datetime.now(timezone.utc)
        app.group_id = group.id
        app.assigned_group_id = group.id
        app.created_member_id = new_member.id
        app.member_id = new_member.id

        AuditService.log(
            db, action="APPROVE", module="member_applications", record_id=str(app.id),
            user=current_user, details=f"Approved member application. Created Member {new_member.member_number} in Group {group.name}"
        )

    elif review_in.action.upper() == "REJECT":
        app.status = "REJECTED"
        app.rejected_at = datetime.now(timezone.utc)
        app.rejection_reason = review_in.review_notes or "Application was rejected during administrative review."
        AuditService.log(
            db, action="REJECT", module="member_applications", record_id=str(app.id),
            user=current_user, details=f"Rejected member application. Reason: {review_in.review_notes}"
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action. Must be APPROVE or REJECT")

    db.commit()
    db.refresh(app)
    return app

