from datetime import date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ReportSummaryItem(BaseModel):
    label: str
    inflow: Decimal = Decimal("0.00")
    outflow: Decimal = Decimal("0.00")
    net: Decimal = Decimal("0.00")
    count: int = 0


class FinancialReportResponse(BaseModel):
    report_title: str
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    group_id: Optional[int] = None
    group_name: Optional[str] = None
    total_inflow: Decimal
    total_outflow: Decimal
    net_change: Decimal
    breakdown_by_type: Dict[str, Decimal] = {}
    items: List[Dict[str, Any]] = []


class MemberLedgerEntry(BaseModel):
    date: date
    type: str
    description: str
    amount: Decimal
    status: str
    reference: Optional[str] = None


class MemberLedgerResponse(BaseModel):
    member_id: int
    member_name: str
    member_number: str
    group_name: str
    monthly_rate: Decimal
    total_paid: Decimal
    total_due: Decimal
    entries: List[MemberLedgerEntry] = []
