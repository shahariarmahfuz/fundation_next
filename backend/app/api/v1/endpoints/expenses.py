import uuid
from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.expense import Expense, ExpenseCategory
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.schemas.expense import ExpenseResponse, ExpenseCreate
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ExpenseResponse])
def get_expenses(
    group_id: Optional[int] = None,
    category_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.view"))
) -> Any:
    query = db.query(Expense)
    if group_id:
        query = query.filter(Expense.group_id == group_id)
    if category_id:
        query = query.filter(Expense.category_id == category_id)

    total = query.count()
    items = query.order_by(Expense.expense_date.desc(), Expense.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.view"))
) -> Any:
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return exp


@router.post("", response_model=ExpenseResponse)
def create_expense(
    exp_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.create"))
) -> Any:
    # 1. Validate Group
    group = db.query(Group).filter(Group.id == exp_in.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target Group does not exist")
    
    # 2. Validate Category
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == exp_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Expense Category does not exist")

    # 3. Create atomic Financial Transaction (checks sufficient funds!)
    txn = AccountingService.create_transaction(
        db=db,
        group_id=group.id,
        transaction_type="EXPENSE",
        flow_type="OUTFLOW",
        amount=exp_in.amount,
        description=f"Expense [{cat.name}]: {exp_in.description}",
        payment_method=exp_in.payment_method,
        reference=exp_in.reference,
        related_entity_type="expense",
        created_by_id=current_user.id,
        check_sufficient_funds=True
    )

    unique_code = uuid.uuid4().hex[:6].upper()
    exp_num = f"EXP-{exp_in.expense_date.strftime('%Y%m%d')}-{unique_code}"

    expense = Expense(
        expense_number=exp_num,
        category_id=cat.id,
        group_id=group.id,
        amount=exp_in.amount,
        expense_date=exp_in.expense_date,
        payment_method=exp_in.payment_method,
        reference=exp_in.reference,
        payee=exp_in.payee,
        description=exp_in.description,
        notes=exp_in.notes,
        transaction_id=txn.id,
        created_by_id=current_user.id
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    cache.invalidate_financial_caches(group.id)
    AuditService.log(
        db, action="CREATE", module="expenses", record_id=str(expense.id),
        user=current_user,
        new_values={
            "expense_number": expense.expense_number,
            "group": group.name,
            "category": cat.name,
            "amount": str(expense.amount)
        }
    )
    db.commit()
    return expense
