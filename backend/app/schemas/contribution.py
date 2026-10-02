import re
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from backend.app.schemas.member import MemberResponse
from backend.app.schemas.group import GroupResponse
from backend.app.schemas.transaction import TransactionResponse


class ContributionBase(BaseModel):
    member_id: int
    contribution_month: str  # YYYY-MM
    amount: Optional[Decimal] = None  # defaults to member's monthly contribution if None
    payment_method: Optional[str] = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("contribution_month")
    @classmethod
    def validate_month_format(cls, v: str) -> str:
        if not v or not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", v.strip()):
            raise ValueError("Contribution month must be in YYYY-MM format (e.g. 2026-10)")
        return v.strip()


class ContributionCreate(ContributionBase):
    pass


class ContributionPay(BaseModel):
    payment_date: Optional[date] = None
    payment_method: str = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None


class ContributionGenerateMonth(BaseModel):
    contribution_month: str  # YYYY-MM

    @field_validator("contribution_month")
    @classmethod
    def validate_gen_month_format(cls, v: str) -> str:
        if not v or not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", v.strip()):
            raise ValueError("Contribution month must be in YYYY-MM format (e.g. 2026-10)")
        return v.strip()


class ContributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contribution_number: str
    member_id: int
    group_id: int
    contribution_month: str
    amount: Decimal
    status: str
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    transaction_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    member: Optional[MemberResponse] = None
    group: Optional[GroupResponse] = None
    transaction: Optional[TransactionResponse] = None


class ContributionBatchCreate(BaseModel):
    member_id: int
    months: list[str]
    payment_method: Optional[str] = "CASH"
    reference: Optional[str] = None
    notes: Optional[str] = None
    payment_date: Optional[date] = None

    @field_validator("months")
    @classmethod
    def validate_months(cls, v: list[str]) -> list[str]:
        if not v or len(v) == 0:
            raise ValueError("At least one contribution month must be selected")
        validated = []
        for m in v:
            clean = m.strip()
            if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", clean):
                raise ValueError(f"Invalid month format '{clean}'. Expected YYYY-MM")
            if clean not in validated:
                validated.append(clean)
        return sorted(validated)


class PeriodStatusItem(BaseModel):
    month: str
    year: int
    month_num: int
    month_name: str
    status: str  # PAID, DUE, CURRENT_PENDING, FUTURE
    is_paid: bool
    is_selectable: bool
    amount: Decimal
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    contribution_id: Optional[int] = None
    transaction_id: Optional[int] = None


class MemberPeriodsResponse(BaseModel):
    member_id: int
    member_name: str
    member_number: str
    group_id: int
    group_name: str
    current_month: str
    available_years: list[int]
    selected_year: int
    periods: list[PeriodStatusItem]
    summary: dict


class ContributionBatchResponse(BaseModel):
    success: bool
    transaction_id: int
    transaction_number: str
    member_id: int
    member_name: str
    member_number: str
    group_id: int
    group_name: str
    months: list[str]
    months_count: int
    total_amount: Decimal
    payment_method: str
    reference: Optional[str] = None
    contributions: list[ContributionResponse]

