from datetime import date, datetime
from decimal import Decimal
from typing import List, Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.group import Group
from backend.app.models.transaction import FinancialTransaction
from backend.app.models.user import User
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService

router = APIRouter()


@router.get("/group/{group_id}")
def get_group_ledger(
    group_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ledgers.view"))
) -> Any:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    # Fetch all transactions up to date_from to compute opening balance for this period
    query = db.query(FinancialTransaction).filter(
        FinancialTransaction.group_id == group_id
    )

    prior_inflows = Decimal("0.00")
    prior_outflows = Decimal("0.00")
    if date_from:
        prior_txns = query.filter(
            FinancialTransaction.transaction_date < datetime.combine(date_from, datetime.min.time())
        ).all()
        for pt in prior_txns:
            if pt.flow_type == "INFLOW":
                prior_inflows += pt.amount
            elif pt.flow_type == "OUTFLOW":
                prior_outflows += pt.amount

    period_opening_balance = group.opening_balance + prior_inflows - prior_outflows

    # Fetch period transactions ordered chronologically
    period_query = db.query(FinancialTransaction).filter(FinancialTransaction.group_id == group_id)
    if date_from:
        period_query = period_query.filter(FinancialTransaction.transaction_date >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        period_query = period_query.filter(FinancialTransaction.transaction_date <= datetime.combine(date_to, datetime.max.time()))

    period_txns = period_query.order_by(FinancialTransaction.transaction_date.asc(), FinancialTransaction.id.asc()).all()

    running_bal = period_opening_balance
    ledger_entries = []
    total_inflows = Decimal("0.00")
    total_outflows = Decimal("0.00")

    for t in period_txns:
        income_val = t.amount if t.flow_type == "INFLOW" else Decimal("0.00")
        expense_val = t.amount if t.flow_type == "OUTFLOW" else Decimal("0.00")

        if t.flow_type == "INFLOW":
            running_bal += t.amount
            total_inflows += t.amount
        elif t.flow_type == "OUTFLOW":
            running_bal -= t.amount
            total_outflows += t.amount

        ledger_entries.append({
            "id": t.id,
            "transaction_number": t.transaction_number,
            "date": t.transaction_date,
            "transaction_type": t.transaction_type,
            "flow_type": t.flow_type,
            "description": t.description,
            "reference": t.reference,
            "payment_method": t.payment_method,
            "related_entity_type": t.related_entity_type,
            "related_entity_id": t.related_entity_id,
            "income": income_val if t.flow_type == "INFLOW" else None,
            "expense": expense_val if t.flow_type == "OUTFLOW" else None,
            "running_balance": running_bal,
            "is_reversed": t.is_reversed,
            "reversal_reason": t.reversal_reason
        })

    authoritative_balance = AccountingService.get_group_current_balance(db, group_id)

    return {
        "group": {
            "id": group.id,
            "name": group.name,
            "code": group.code,
            "status": group.status,
            "initial_opening_balance": group.opening_balance,
            "authoritative_current_balance": authoritative_balance
        },
        "period": {
            "date_from": date_from,
            "date_to": date_to,
            "period_opening_balance": period_opening_balance,
            "period_total_inflows": total_inflows,
            "period_total_outflows": total_outflows,
            "period_closing_balance": running_bal
        },
        "entries": ledger_entries
    }
