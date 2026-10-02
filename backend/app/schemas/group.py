from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class GroupBase(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    status: str = "ACTIVE"
    opening_balance: Decimal = Decimal("0.00")


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class GroupResponse(GroupBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    created_at: datetime
    updated_at: datetime
    # Calculated financial metrics
    current_balance: Optional[Decimal] = None
    total_income: Optional[Decimal] = None
    total_expense: Optional[Decimal] = None
    total_members: Optional[int] = None
    total_qard_outstanding: Optional[Decimal] = None


class GroupTransferCreate(BaseModel):
    source_group_id: int
    destination_group_id: int
    amount: Decimal
    notes: Optional[str] = None
    payment_method: str = "INTERNAL_TRANSFER"


class GroupTransferResponse(BaseModel):
    success: bool = True
    transfer_amount: Decimal
    source_group_id: int
    source_group_new_balance: Decimal
    destination_group_id: int
    destination_group_new_balance: Decimal
    outflow_transaction_number: str
    inflow_transaction_number: str
    message: str
