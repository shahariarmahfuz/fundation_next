from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.transaction import TransactionResponse


class GroupBalanceCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    balance: Decimal
    members_count: int


class DashboardStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_members: int = 0
    active_members: int = 0
    total_groups: int = 0
    total_collection: Decimal = Decimal("0.00")
    total_donations: Decimal = Decimal("0.00")
    total_expenses: Decimal = Decimal("0.00")
    total_qard_outstanding: Decimal = Decimal("0.00")
    total_sadakah: Decimal = Decimal("0.00")
    total_due_contributions: Decimal = Decimal("0.00")
    total_foundation_balance: Decimal = Decimal("0.00")
    groups: List[GroupBalanceCard] = []
    recent_transactions: List[TransactionResponse] = []


class DashboardResponse(BaseModel):
    success: bool = True
    data: DashboardStats


class DashboardErrorDetail(BaseModel):
    code: str
    message: str


class DashboardErrorResponse(BaseModel):
    success: bool = False
    error: DashboardErrorDetail
