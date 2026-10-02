from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator


class MonthlyContributionSettingBase(BaseModel):
    amount: Decimal
    effective_from: date
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Monthly contribution amount must be strictly greater than 0")
        return v


class MonthlyContributionSettingCreate(MonthlyContributionSettingBase):
    pass


class MonthlyContributionSettingResponse(MonthlyContributionSettingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None
    status: str = "HISTORICAL"  # ACTIVE, SCHEDULED, HISTORICAL


class MonthlyContributionOverviewResponse(BaseModel):
    current_amount: Decimal
    effective_date: date
    active_setting: Optional[MonthlyContributionSettingResponse] = None
    scheduled_settings: List[MonthlyContributionSettingResponse] = []
    history: List[MonthlyContributionSettingResponse] = []
