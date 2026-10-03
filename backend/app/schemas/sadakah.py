from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.beneficiary import BeneficiaryResponse
from backend.app.schemas.transaction import TransactionResponse


class SadakahFundingAllocationCreate(BaseModel):
    group_id: int
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def validate_positive_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Allocation amount must be strictly positive")
        return v


class SadakahFundingAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sadakah_id: int
    group_id: int
    allocated_amount: Decimal
    transaction_id: Optional[int] = None
    created_at: datetime
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None


class SadakahCreate(BaseModel):
    beneficiary_id: int
    amount: Decimal
    description: Optional[str] = None
    purpose: Optional[str] = None
    disbursement_date: Optional[date] = None
    payment_method: str = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None
    funding_allocations: Optional[List[SadakahFundingAllocationCreate]] = None
    group_id: Optional[int] = None  # Single-group fallback

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Sadaqah amount must be strictly positive")
        return v

    @model_validator(mode="after")
    def unify_description_purpose(self):
        # Support either 'purpose' or 'description'
        if not self.description and self.purpose:
            self.description = self.purpose
        elif not self.description and not self.purpose:
            self.description = "Direct humanitarian Sadaqah aid"
        return self


class SadakahResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sadakah_number: str
    group_id: Optional[int] = None
    beneficiary_id: Optional[int] = None
    amount: Decimal
    disbursement_date: Optional[date] = None
    payment_method: Optional[str] = "CASH"
    description: Optional[str] = ""
    reference: Optional[str] = None
    notes: Optional[str] = None
    transaction_id: Optional[int] = None
    created_at: Optional[datetime] = None
    group: Optional[GroupResponse] = None
    beneficiary: Optional[BeneficiaryResponse] = None
    transaction: Optional[TransactionResponse] = None
    funding_allocations: List[SadakahFundingAllocationResponse] = []


class SadakahLedgerItem(BaseModel):
    id: int
    sadakah_number: str
    disbursement_date: Optional[date] = None
    beneficiary_id: Optional[int] = None
    beneficiary_name: Optional[str] = "Unknown"
    beneficiary_number: Optional[str] = ""
    amount: Decimal
    description: Optional[str] = ""
    payment_method: Optional[str] = "CASH"
    reference: Optional[str] = None
    created_by_name: Optional[str] = None
    funding_groups: List[str] = []
    funding_allocations: List[SadakahFundingAllocationResponse] = []


class SadakahLedgerResponse(BaseModel):
    items: List[SadakahLedgerItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary: dict
