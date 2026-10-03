from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, model_validator
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.transaction import TransactionResponse
from backend.app.schemas.member import MemberResponse


class DonorBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: str = "ACTIVE"
    notes: Optional[str] = None


class DonorCreate(DonorBase):
    donor_number: Optional[str] = None
    code: Optional[str] = None


class DonorUpdate(BaseModel):
    name: Optional[str] = None
    donor_number: Optional[str] = None
    code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class DonorResponse(DonorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    donor_number: str
    created_at: datetime
    updated_at: datetime
    total_donations: Optional[Decimal] = None
    donation_count: Optional[int] = None


class DonationBase(BaseModel):
    source_type: str = "DONOR"  # "DONOR" or "MEMBER"
    donor_id: Optional[int] = None
    member_id: Optional[int] = None
    group_id: int
    amount: Decimal
    donation_date: date = date.today()
    payment_method: str = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None


class DonationCreate(DonationBase):
    @model_validator(mode="after")
    def validate_source(self):
        if self.source_type == "DONOR":
            if not self.donor_id:
                raise ValueError("donor_id is required when source_type is DONOR")
            if self.member_id is not None:
                raise ValueError("member_id must be None when source_type is DONOR")
        elif self.source_type == "MEMBER":
            if not self.member_id:
                raise ValueError("member_id is required when source_type is MEMBER")
            if self.donor_id is not None:
                raise ValueError("donor_id must be None when source_type is MEMBER")
        else:
            raise ValueError(f"Invalid source_type: '{self.source_type}'. Must be 'DONOR' or 'MEMBER'")
        if self.amount <= 0:
            raise ValueError("Amount must be greater than 0")
        return self


class DonationResponse(DonationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    donation_number: str
    status: Optional[str] = "COMPLETED"
    transaction_id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    donor: Optional[DonorResponse] = None
    member: Optional[MemberResponse] = None
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None
