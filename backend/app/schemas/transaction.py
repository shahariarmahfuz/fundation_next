from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.group import GroupResponse


class TransactionBase(BaseModel):
    group_id: int
    transaction_type: str
    flow_type: str
    amount: Decimal
    transaction_date: Optional[datetime] = None
    description: str
    reference: Optional[str] = None
    payment_method: str = "CASH"
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None


class TransactionCreate(TransactionBase):
    pass


class ReversalRequest(BaseModel):
    reversal_reason: str


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_number: str
    balance_after: Decimal
    is_reversed: bool
    reversed_by_id: Optional[int] = None
    reversal_reason: Optional[str] = None
    reversal_transaction_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    group: Optional[GroupResponse] = None
