from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from backend.app.schemas.group import GroupResponse


class MemberApplicationCreate(BaseModel):
    applicant_name: str
    email: Optional[EmailStr] = None
    phone: str
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    proposed_contribution: Decimal = Decimal("500.00")
    reason_for_joining: Optional[str] = None


class MemberApplicationReview(BaseModel):
    action: str  # APPROVE, REJECT
    assigned_group_id: Optional[int] = None  # Required if APPROVE
    review_notes: Optional[str] = None


class MemberApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    applicant_name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    proposed_contribution: Decimal
    reason_for_joining: Optional[str] = None
    status: str
    review_notes: Optional[str] = None
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    assigned_group_id: Optional[int] = None
    created_member_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    assigned_group: Optional[GroupResponse] = None
