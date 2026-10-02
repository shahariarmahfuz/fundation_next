from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.member import Member
from backend.app.models.group import Group
from backend.app.models.contribution import Contribution
from backend.app.models.donor import Donation
from backend.app.models.expense import Expense
from backend.app.models.qard_hasan import QardHasan
from backend.app.models.sadakah import Sadakah
from backend.app.models.transaction import FinancialTransaction
from backend.app.models.user import User
from backend.app.schemas.dashboard import DashboardStats, GroupBalanceCard
from backend.app.api.deps import require_permission
from backend.app.services.accounting_service import AccountingService

router = APIRouter()


@router.get("", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard.view"))
) -> Any:
    cache_key = "dashboard:stats"
    cached = cache.get(cache_key)
    if cached:
        return cached

    total_members = db.query(Member).count()
    active_members = db.query(Member).filter(Member.status == "ACTIVE").count()
    total_groups = db.query(Group).filter(Group.status == "ACTIVE").count()

    total_collection = db.query(func.coalesce(func.sum(Contribution.amount), Decimal("0.00"))).filter(
        Contribution.status == "PAID"
    ).scalar() or Decimal("0.00")

    total_donations = db.query(func.coalesce(func.sum(Donation.amount), Decimal("0.00"))).scalar() or Decimal("0.00")
    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).scalar() or Decimal("0.00")

    total_qard_outstanding = db.query(func.coalesce(func.sum(QardHasan.outstanding_amount), Decimal("0.00"))).filter(
        QardHasan.status == "ACTIVE"
    ).scalar() or Decimal("0.00")

    total_sadakah = db.query(func.coalesce(func.sum(Sadakah.amount), Decimal("0.00"))).scalar() or Decimal("0.00")

    total_due_contributions = db.query(func.coalesce(func.sum(Contribution.amount), Decimal("0.00"))).filter(
        Contribution.status.in_(["DUE", "CURRENT_PENDING"])
    ).scalar() or Decimal("0.00")

    groups = db.query(Group).filter(Group.status == "ACTIVE").order_by(Group.id).all()
    group_cards = []
    total_foundation_balance = Decimal("0.00")

    for g in groups:
        bal = AccountingService.get_group_current_balance(db, g.id)
        total_foundation_balance += bal
        m_count = db.query(Member).filter(Member.group_id == g.id, Member.status == "ACTIVE").count()
        group_cards.append(GroupBalanceCard(
            id=g.id,
            name=g.name,
            code=g.code,
            balance=bal,
            members_count=m_count
        ))

    recent_txns = db.query(FinancialTransaction).order_by(
        FinancialTransaction.transaction_date.desc(),
        FinancialTransaction.id.desc()
    ).limit(10).all()

    stats = {
        "total_members": total_members,
        "active_members": active_members,
        "total_groups": total_groups,
        "total_collection": total_collection,
        "total_donations": total_donations,
        "total_expenses": total_expenses,
        "total_qard_outstanding": total_qard_outstanding,
        "total_sadakah": total_sadakah,
        "total_due_contributions": total_due_contributions,
        "total_foundation_balance": total_foundation_balance,
        "groups": group_cards,
        "recent_transactions": recent_txns
    }

    resp = DashboardStats(**stats)
    cache.set(cache_key, resp.model_dump(), expire_seconds=300)
    return resp
