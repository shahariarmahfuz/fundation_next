from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.transaction import TransactionResponse


class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True


class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ExpenseCategoryResponse(ExpenseCategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ExpenseBase(BaseModel):
    category_id: int
    group_id: int
    amount: Decimal
    expense_date: date = date.today()
    payment_method: str = "CASH"
    reference: Optional[str] = None
    payee: Optional[str] = None
    description: str
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    expense_number: str
    transaction_id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[ExpenseCategoryResponse] = None
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None
