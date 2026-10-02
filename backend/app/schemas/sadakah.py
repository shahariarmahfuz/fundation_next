from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.beneficiary import BeneficiaryResponse
from backend.app.schemas.transaction import TransactionResponse


class SadakahBase(BaseModel):
    group_id: int
    beneficiary_id: int
    amount: Decimal
    disbursement_date: date = date.today()
    payment_method: str = "CASH"
    description: str
    reference: Optional[str] = None
    notes: Optional[str] = None


class SadakahCreate(SadakahBase):
    pass


class SadakahResponse(SadakahBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sadakah_number: str
    transaction_id: int
    created_at: datetime
    group: Optional[GroupResponse] = None
    beneficiary: Optional[BeneficiaryResponse] = None
    transaction: Optional[TransactionResponse] = None
