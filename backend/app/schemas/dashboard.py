from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel
from backend.app.schemas.transaction import TransactionResponse


class GroupBalanceCard(BaseModel):
    id: int
    name: str
    code: str
    balance: Decimal
    members_count: int


class DashboardStats(BaseModel):
    total_members: int
    active_members: int
    total_groups: int
    total_collection: Decimal
    total_donations: Decimal
    total_expenses: Decimal
    total_qard_outstanding: Decimal
    total_sadakah: Decimal
    total_due_contributions: Decimal
    total_foundation_balance: Decimal
    groups: List[GroupBalanceCard] = []
    recent_transactions: List[TransactionResponse] = []
