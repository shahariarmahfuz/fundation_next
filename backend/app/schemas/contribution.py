from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.member import MemberResponse
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.transaction import TransactionResponse


class ContributionBase(BaseModel):
    member_id: int
    contribution_month: str  # YYYY-MM
    amount: Optional[Decimal] = None  # defaults to member's monthly contribution if None
    payment_method: Optional[str] = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None


class ContributionCreate(ContributionBase):
    pass


class ContributionPay(BaseModel):
    payment_date: Optional[date] = None
    payment_method: str = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None


class ContributionGenerateMonth(BaseModel):
    contribution_month: str  # YYYY-MM


class ContributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contribution_number: str
    member_id: int
    group_id: int
    contribution_month: str
    amount: Decimal
    status: str
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    transaction_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    member: Optional[MemberResponse] = None
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None
