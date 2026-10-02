from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.beneficiary import BeneficiaryResponse
from backend.app.schemas.transaction import TransactionResponse


class QardHasanBase(BaseModel):
    group_id: int
    beneficiary_id: int
    principal_amount: Decimal
    monthly_repayment_amount: Decimal
    disbursed_date: date = date.today()
    repayment_schedule_notes: Optional[str] = None
    notes: Optional[str] = None


class QardHasanCreate(QardHasanBase):
    pass


class QardRepaymentCreate(BaseModel):
    qard_hasan_id: int
    amount: Decimal
    repayment_date: date = date.today()
    payment_method: str = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None


class QardRepaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repayment_number: str
    qard_hasan_id: int
    group_id: int
    beneficiary_id: int
    amount: Decimal
    repayment_date: date
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    transaction_id: int
    created_at: datetime
    transaction: Optional[TransactionResponse] = None


class QardHasanResponse(QardHasanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    qard_number: str
    total_repaid: Decimal
    outstanding_amount: Decimal
    interest_rate: Decimal = Decimal("0.00")
    status: str
    disbursement_transaction_id: int
    created_at: datetime
    updated_at: datetime
    group: Optional[GroupResponse] = None
    beneficiary: Optional[BeneficiaryResponse] = None
    repayments: List[QardRepaymentResponse] = []
