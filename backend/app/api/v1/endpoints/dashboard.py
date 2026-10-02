import logging
from decimal import Decimal
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
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
from backend.app.schemas.dashboard import (
    DashboardStats,
    GroupBalanceCard,
    DashboardResponse,
    DashboardErrorResponse,
)
from backend.app.schemas.transaction import TransactionResponse
from backend.app.api.deps import require_permission

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=DashboardResponse,
    responses={
        503: {"model": DashboardErrorResponse, "description": "Database or service unavailable"}
    },
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard.view"))
) -> Any:
    cache_key = "dashboard:stats"
    
    # 1. Attempt to serve from cache with safety validation
    try:
        cached = cache.get(cache_key)
        if cached:
            if isinstance(cached, dict) and "data" in cached:
                return DashboardResponse(**cached)
            elif isinstance(cached, dict):
                return DashboardResponse(success=True, data=DashboardStats(**cached))
    except Exception as cache_err:
        logger.warning(f"Cache read/deserialization error: {cache_err}. Proceeding with live database query.")

    # 2. Live database query with transaction safety and consolidated aggregation
    try:
        # A. Member aggregates (safely handle empty table)
        total_members = db.query(func.coalesce(func.count(Member.id), 0)).scalar() or 0
        active_members = (
            db.query(func.coalesce(func.count(Member.id), 0))
            .filter(Member.status == "ACTIVE")
            .scalar()
            or 0
        )

        # B. Active groups count
        total_groups = (
            db.query(func.coalesce(func.count(Group.id), 0))
            .filter(Group.status == "ACTIVE")
            .scalar()
            or 0
        )

        # C. Financial totals with coalesce to guarantee Decimal("0.00")
        total_collection = (
            db.query(func.coalesce(func.sum(Contribution.amount), Decimal("0.00")))
            .filter(Contribution.status == "PAID")
            .scalar()
            or Decimal("0.00")
        )

        total_donations = (
            db.query(func.coalesce(func.sum(Donation.amount), Decimal("0.00"))).scalar()
            or Decimal("0.00")
        )

        total_expenses = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).scalar()
            or Decimal("0.00")
        )

        total_qard_outstanding = (
            db.query(func.coalesce(func.sum(QardHasan.outstanding_amount), Decimal("0.00")))
            .filter(QardHasan.status == "ACTIVE")
            .scalar()
            or Decimal("0.00")
        )

        total_sadakah = (
            db.query(func.coalesce(func.sum(Sadakah.amount), Decimal("0.00"))).scalar()
            or Decimal("0.00")
        )

        total_due_contributions = (
            db.query(func.coalesce(func.sum(Contribution.amount), Decimal("0.00")))
            .filter(Contribution.status.in_(["DUE", "CURRENT_PENDING"]))
            .scalar()
            or Decimal("0.00")
        )

        # D. High-performance consolidated group calculations (replaces N+1 queries)
        # Fetch active groups
        groups = (
            db.query(Group)
            .filter(Group.status == "ACTIVE")
            .order_by(Group.id)
            .all()
        )

        # Inflows and Outflows per group in a single consolidated SQL query
        flow_sums = (
            db.query(
                FinancialTransaction.group_id,
                FinancialTransaction.flow_type,
                func.coalesce(func.sum(FinancialTransaction.amount), Decimal("0.00")),
            )
            .group_by(FinancialTransaction.group_id, FinancialTransaction.flow_type)
            .all()
        )

        flow_map = {}
        for gid, ftype, amt in flow_sums:
            if gid not in flow_map:
                flow_map[gid] = {"INFLOW": Decimal("0.00"), "OUTFLOW": Decimal("0.00")}
            flow_map[gid][ftype] = amt

        # Active member count per group in a single query
        member_counts = dict(
            db.query(Member.group_id, func.count(Member.id))
            .filter(Member.status == "ACTIVE")
            .group_by(Member.group_id)
            .all()
        )

        group_cards: List[GroupBalanceCard] = []
        total_foundation_balance = Decimal("0.00")

        for g in groups:
            inflow = flow_map.get(g.id, {}).get("INFLOW", Decimal("0.00"))
            outflow = flow_map.get(g.id, {}).get("OUTFLOW", Decimal("0.00"))
            opening = g.opening_balance or Decimal("0.00")
            bal = opening + inflow - outflow
            total_foundation_balance += bal
            m_count = member_counts.get(g.id, 0)

            group_cards.append(
                GroupBalanceCard(
                    id=g.id,
                    name=g.name,
                    code=g.code,
                    balance=bal,
                    members_count=m_count,
                )
            )

        # E. Recent transactions
        recent_txns_raw = (
            db.query(FinancialTransaction)
            .order_by(
                FinancialTransaction.transaction_date.desc(),
                FinancialTransaction.id.desc(),
            )
            .limit(10)
            .all()
        )

        recent_txns: List[TransactionResponse] = [
            TransactionResponse.model_validate(t) for t in recent_txns_raw
        ]

        stats_data = DashboardStats(
            total_members=total_members,
            active_members=active_members,
            total_groups=total_groups,
            total_collection=total_collection,
            total_donations=total_donations,
            total_expenses=total_expenses,
            total_qard_outstanding=total_qard_outstanding,
            total_sadakah=total_sadakah,
            total_due_contributions=total_due_contributions,
            total_foundation_balance=total_foundation_balance,
            groups=group_cards,
            recent_transactions=recent_txns,
        )

        response = DashboardResponse(success=True, data=stats_data)

        # Cache with JSON mode to ensure clean serialization
        try:
            cache.set(cache_key, response.model_dump(mode="json"), expire_seconds=300)
        except Exception as cache_write_err:
            logger.warning(f"Cache write error: {cache_write_err}")

        return response

    except Exception as err:
        logger.exception(f"Unhandled error in get_dashboard_stats: {err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DASHBOARD_DATA_UNAVAILABLE",
                "message": "Unable to load dashboard financial data from database.",
            },
        )
