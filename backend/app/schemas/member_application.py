from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from backend.app.schemas.group import GroupResponse


class PublicGroupOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str


class MemberApplicationCreate(BaseModel):
    full_name: Optional[str] = None
    applicant_name: Optional[str] = None
    group_id: int

    # Optional fields (omitted in public form, preserved for backwards compatibility)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    proposed_contribution: Optional[Decimal] = None
    reason_for_joining: Optional[str] = None


class MemberApplicationReview(BaseModel):
    action: str  # APPROVE, REJECT
    assigned_group_id: Optional[int] = None  # Optional override if APPROVE
    review_notes: Optional[str] = None


class MemberApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: Optional[str] = None
    applicant_name: str
    full_name: Optional[str] = None
    group_id: Optional[int] = None
    assigned_group_id: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    proposed_contribution: Optional[Decimal] = None
    reason_for_joining: Optional[str] = None
    status: str
    review_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    created_member_id: Optional[int] = None
    member_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    group: Optional[GroupResponse] = None
    assigned_group: Optional[GroupResponse] = None


class PublicApplicationStatusResponse(BaseModel):
    request_id: str
    applicant_name: str
    group_name: str
    status: str
    submitted_date: str
    member_id: Optional[str] = None  # Human-readable member code (e.g. M-0128)
    rejection_reason: Optional[str] = None

