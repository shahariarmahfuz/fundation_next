from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.beneficiary import BeneficiaryResponse
from backend.app.schemas.transaction import TransactionResponse


class FundingAllocationCreate(BaseModel):
    group_id: int
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def validate_positive_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Funding allocation amount must be strictly positive")
        return v


class FundingAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    qard_hasan_id: int
    group_id: int
    allocated_amount: Decimal
    repaid_amount: Decimal
    outstanding_amount: Decimal
    transaction_id: Optional[int] = None
    created_at: datetime
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None


class RepaymentAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repayment_id: int
    funding_allocation_id: int
    group_id: int
    allocated_amount: Decimal
    transaction_id: Optional[int] = None
    created_at: datetime
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None


class QardHasanCreate(BaseModel):
    beneficiary_id: int
    principal_amount: Decimal
    monthly_repayment_amount: Decimal
    disbursed_date: Optional[date] = None
    funding_allocations: Optional[List[FundingAllocationCreate]] = None
    group_id: Optional[int] = None  # Single-group fallback
    repayment_schedule_notes: Optional[str] = None
    notes: Optional[str] = None
    payment_method: Optional[str] = "CASH"
    reference: Optional[str] = None

    @field_validator("principal_amount")
    @classmethod
    def validate_principal(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Principal amount must be strictly positive")
        return v

    @field_validator("monthly_repayment_amount")
    @classmethod
    def validate_monthly(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Monthly repayment amount must be strictly positive")
        return v


class QardRepaymentCreate(BaseModel):
    qard_hasan_id: int
    amount: Decimal
    repayment_date: Optional[date] = None
    payment_method: str = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Repayment amount must be strictly positive")
        return v


class QardRepaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repayment_number: str
    qard_hasan_id: int
    group_id: Optional[int] = None
    beneficiary_id: int
    amount: Decimal
    repayment_date: date
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    transaction_id: Optional[int] = None
    created_at: datetime
    allocations: List[RepaymentAllocationResponse] = []
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None


class QardHasanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    qard_number: str
    group_id: Optional[int] = None
    beneficiary_id: Optional[int] = None
    principal_amount: Decimal
    monthly_repayment_amount: Decimal
    total_repaid: Decimal = Decimal("0.00")
    outstanding_amount: Decimal = Decimal("0.00")
    interest_rate: Decimal = Decimal("0.00")
    status: str = "ACTIVE"
    disbursed_date: Optional[date] = None
    repayment_schedule_notes: Optional[str] = None
    notes: Optional[str] = None
    disbursement_transaction_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    group: Optional[GroupResponse] = None
    beneficiary: Optional[BeneficiaryResponse] = None
    funding_allocations: List[FundingAllocationResponse] = []
    repayments: List[QardRepaymentResponse] = []


class RepaymentPreviewItem(BaseModel):
    funding_allocation_id: int
    group_id: int
    group_name: str
    group_code: Optional[str] = None
    original_allocated: Decimal
    already_repaid: Decimal
    current_outstanding: Decimal
    repayment_share: Decimal
    new_outstanding: Decimal


class RepaymentPreviewResponse(BaseModel):
    qard_hasan_id: int
    repayment_amount: Decimal
    total_allocated: Decimal
    difference: Decimal
    allocations: List[RepaymentPreviewItem]


class QardHasanLedgerItem(BaseModel):
    id: int
    qard_number: str
    beneficiary_id: Optional[int] = None
    beneficiary_name: Optional[str] = "Unknown"
    beneficiary_number: Optional[str] = ""
    principal_amount: Decimal
    monthly_repayment_amount: Decimal
    total_repaid: Decimal = Decimal("0.00")
    outstanding_amount: Decimal = Decimal("0.00")
    disbursed_date: Optional[date] = None
    status: str = "ACTIVE"
    funding_groups: List[str] = []
    funding_allocations: List[FundingAllocationResponse] = []


class QardHasanLedgerResponse(BaseModel):
    items: List[QardHasanLedgerItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary: dict
