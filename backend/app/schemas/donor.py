from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.transaction import TransactionResponse


class DonorBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    status: str = "ACTIVE"
    notes: Optional[str] = None


class DonorCreate(DonorBase):
    pass


class DonorUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
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
    donor_id: Optional[int] = None
    group_id: int
    amount: Decimal
    donation_date: date = date.today()
    payment_method: str = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None


class DonationCreate(DonationBase):
    pass


class DonationResponse(DonationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    donation_number: str
    transaction_id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    donor: Optional[DonorResponse] = None
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None
