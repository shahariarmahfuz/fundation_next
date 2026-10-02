from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, model_validator
from backend.app.schemas.group import GroupResponse


class MemberBase(BaseModel):
    # Only full_name and group_id are required
    full_name: str
    group_id: int

    # All other fields are completely optional
    member_number: Optional[str] = None
    code: Optional[str] = None
    status: str = "ACTIVE"
    joining_date: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    alternative_phone: Optional[str] = None
    address: Optional[str] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None
    nid_or_id: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    blood_group: Optional[str] = None
    marital_status: Optional[str] = None
    
    # Emergency Contact (optional)
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Reference (optional)
    reference_name: Optional[str] = None
    reference_phone: Optional[str] = None
    reference_relationship: Optional[str] = None

    # Commitment & Documents (optional)
    commitment: Optional[str] = None
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None
    document_type: Optional[str] = None
    nid_front_url: Optional[str] = None
    nid_back_url: Optional[str] = None

    # Remarks & Reason (optional)
    reason_for_joining: Optional[str] = None
    notes: Optional[str] = None


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    group_id: Optional[int] = None
    member_number: Optional[str] = None
    code: Optional[str] = None
    status: Optional[str] = None
    joining_date: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    alternative_phone: Optional[str] = None
    address: Optional[str] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None
    nid_or_id: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    blood_group: Optional[str] = None
    marital_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    reference_name: Optional[str] = None
    reference_phone: Optional[str] = None
    reference_relationship: Optional[str] = None
    commitment: Optional[str] = None
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None
    document_type: Optional[str] = None
    nid_front_url: Optional[str] = None
    nid_back_url: Optional[str] = None
    reason_for_joining: Optional[str] = None
    notes: Optional[str] = None


class MemberResponse(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    group: Optional[GroupResponse] = None
    monthly_contribution_amount: Optional[Decimal] = None
    foundation_monthly_amount: Optional[Decimal] = None
    total_contributions_paid: Optional[Decimal] = None
    pending_contributions_count: Optional[int] = None

    @model_validator(mode="after")
    def populate_code(self):
        if not self.code and self.member_number:
            self.code = self.member_number
        elif not self.member_number and self.code:
            self.member_number = self.code
        return self
