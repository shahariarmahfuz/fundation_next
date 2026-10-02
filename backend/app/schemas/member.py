from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from backend.app.schemas.group import GroupResponse


class MemberBase(BaseModel):
    member_number: Optional[str] = None
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    joining_date: date = date.today()
    status: str = "ACTIVE"
    monthly_contribution_amount: Decimal = Decimal("500.00")
    group_id: int
    notes: Optional[str] = None


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    status: Optional[str] = None
    monthly_contribution_amount: Optional[Decimal] = None
    group_id: Optional[int] = None
    notes: Optional[str] = None


class MemberResponse(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    group: Optional[GroupResponse] = None
    total_contributions_paid: Optional[Decimal] = None
    pending_contributions_count: Optional[int] = None
