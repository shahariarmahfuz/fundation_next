from datetime import date, datetime
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.transaction import FinancialTransaction
from backend.app.models.user import User
from backend.app.schemas.transaction import TransactionResponse, ReversalRequest
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[TransactionResponse])
def get_transactions(
    group_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    flow_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    is_reversed: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("transactions.view"))
) -> Any:
    query = db.query(FinancialTransaction)
    if group_id:
        query = query.filter(FinancialTransaction.group_id == group_id)
    if transaction_type:
        query = query.filter(FinancialTransaction.transaction_type == transaction_type)
    if flow_type:
        query = query.filter(FinancialTransaction.flow_type == flow_type)
    if date_from:
        query = query.filter(FinancialTransaction.transaction_date >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(FinancialTransaction.transaction_date <= datetime.combine(date_to, datetime.max.time()))
    if is_reversed is not None:
        query = query.filter(FinancialTransaction.is_reversed == is_reversed)

    total = query.count()
    items = query.order_by(FinancialTransaction.transaction_date.desc(), FinancialTransaction.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{txn_id}", response_model=TransactionResponse)
def get_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("transactions.view"))
) -> Any:
    txn = db.query(FinancialTransaction).filter(FinancialTransaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return txn


@router.post("/{txn_id}/reverse", response_model=TransactionResponse)
def reverse_transaction(
    txn_id: int,
    reversal_in: ReversalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("transactions.reverse"))
) -> Any:
    """
    Safely reverses an existing financial transaction with full audit trail and balance correction.
    """
    rev_txn = AccountingService.reverse_transaction(
        db=db,
        transaction_id=txn_id,
        user_id=current_user.id,
        reversal_reason=reversal_in.reversal_reason
    )
    db.commit()
    db.refresh(rev_txn)

    AuditService.log(
        db, action="REVERSE", module="transactions", record_id=str(txn_id),
        user=current_user,
        details=f"Reversed transaction {txn_id} creating offset transaction {rev_txn.transaction_number}. Reason: {reversal_in.reversal_reason}"
    )
    db.commit()
    return rev_txn
