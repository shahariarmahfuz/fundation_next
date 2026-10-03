import uuid
from datetime import date
from decimal import Decimal
from typing import List, Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.expense import Expense, ExpenseCategory
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.models.transaction import FinancialTransaction
from backend.app.schemas.expense import (
    ExpenseResponse,
    ExpenseCreate,
    ExpenseReversalRequest,
    ExpenseLedgerResponse,
    ExpenseLedgerItem,
    ExpenseLedgerSummary,
    ExpenseReportResponse,
    ExpenseCategoryReportItem,
    ExpenseGroupReportItem,
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("/ledger", response_model=ExpenseLedgerResponse)
def get_expense_ledger(
    group_id: Optional[int] = None,
    category_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.view"))
) -> Any:
    """
    Comprehensive ledger of all foundation expenses and disbursements with
    authoritative accounting linkages and category/group metrics.
    """
    query = (
        db.query(Expense)
        .join(ExpenseCategory, Expense.category_id == ExpenseCategory.id)
        .join(Group, Expense.group_id == Group.id)
    )

    if group_id:
        query = query.filter(Expense.group_id == group_id)
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if payment_method and payment_method.strip():
        query = query.filter(Expense.payment_method == payment_method.strip())
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Expense.expense_number.ilike(term),
                Expense.description.ilike(term),
                Expense.payee.ilike(term),
                Expense.reference.ilike(term),
                ExpenseCategory.name.ilike(term),
                Group.name.ilike(term),
            )
        )

    # 1. Summary metrics
    total_amount = (
        query.with_entities(
            func.coalesce(func.sum(Expense.amount), Decimal("0.00"))
        ).scalar()
        or Decimal("0.00")
    )
    total_count = query.with_entities(func.count(Expense.id)).scalar() or 0

    # Top category calculation
    top_cat_row = (
        query.with_entities(
            ExpenseCategory.name,
            func.sum(Expense.amount).label("cat_sum")
        )
        .group_by(ExpenseCategory.name)
        .order_by(func.sum(Expense.amount).desc())
        .first()
    )
    top_category = top_cat_row[0] if top_cat_row else None
    top_category_amount = top_cat_row[1] if top_cat_row else None

    # Group breakdown calculation
    grp_rows = (
        query.with_entities(
            Group.name,
            func.sum(Expense.amount).label("grp_sum")
        )
        .group_by(Group.name)
        .all()
    )
    group_breakdown = {row[0]: Decimal(str(row[1])) for row in grp_rows}

    # 2. Paginated rows
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
    expenses = (
        query.order_by(Expense.expense_date.desc(), Expense.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items: List[ExpenseLedgerItem] = []
    for exp in expenses:
        creator_name = None
        if exp.created_by:
            creator_name = exp.created_by.full_name or exp.created_by.username

        items.append(
            ExpenseLedgerItem(
                id=exp.id,
                expense_number=exp.expense_number,
                expense_date=exp.expense_date,
                category_id=exp.category_id,
                category_name=exp.category.name if exp.category else "Uncategorized",
                group_id=exp.group_id,
                group_name=exp.group.name if exp.group else "Unknown Group",
                amount=exp.amount,
                payment_method=exp.payment_method,
                payee=exp.payee,
                description=exp.description,
                reference=exp.reference,
                notes=exp.notes,
                transaction_id=exp.transaction_id,
                transaction_number=exp.transaction.transaction_number if exp.transaction else None,
                is_reversed=bool(exp.transaction and exp.transaction.is_reversed),
                created_at=exp.created_at,
                created_by_name=creator_name,
            )
        )

    return ExpenseLedgerResponse(
        summary=ExpenseLedgerSummary(
            total_amount=total_amount,
            total_count=total_count,
            top_category=top_category,
            top_category_amount=top_category_amount,
            group_breakdown=group_breakdown,
        ),
        items=items,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("", response_model=PaginatedResponse[ExpenseResponse])
def get_expenses(
    group_id: Optional[int] = None,
    category_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.view"))
) -> Any:
    query = (
        db.query(Expense)
        .join(ExpenseCategory, Expense.category_id == ExpenseCategory.id)
        .join(Group, Expense.group_id == Group.id)
    )

    if group_id:
        query = query.filter(Expense.group_id == group_id)
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if payment_method and payment_method.strip():
        query = query.filter(Expense.payment_method == payment_method.strip())
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Expense.expense_number.ilike(term),
                Expense.description.ilike(term),
                Expense.payee.ilike(term),
                Expense.reference.ilike(term),
                ExpenseCategory.name.ilike(term),
                Group.name.ilike(term),
            )
        )

    total = query.count()
    items = (
        query.order_by(Expense.expense_date.desc(), Expense.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/report", response_model=ExpenseReportResponse)
def get_expense_report(
    group_id: Optional[int] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.view"))
) -> Any:
    """
    Summarizes expenses by category and accounting group with dynamic calculations,
    excluding reversed transactions.
    """
    query = (
        db.query(Expense)
        .join(ExpenseCategory, Expense.category_id == ExpenseCategory.id)
        .join(Group, Expense.group_id == Group.id)
        .outerjoin(FinancialTransaction, Expense.transaction_id == FinancialTransaction.id)
        .filter(or_(FinancialTransaction.is_reversed.is_(False), FinancialTransaction.id.is_(None)))
    )

    if group_id:
        query = query.filter(Expense.group_id == group_id)
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    total_amount = (
        query.with_entities(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).scalar()
        or Decimal("0.00")
    )
    total_count = query.with_entities(func.count(Expense.id)).scalar() or 0

    # Category Breakdown
    cat_rows = (
        query.with_entities(
            Expense.category_id,
            ExpenseCategory.name,
            func.count(Expense.id).label("cat_count"),
            func.coalesce(func.sum(Expense.amount), Decimal("0.00")).label("cat_amount")
        )
        .group_by(Expense.category_id, ExpenseCategory.name)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    categories_report: List[ExpenseCategoryReportItem] = []
    for row in cat_rows:
        cid, cname, cnt, amt = row
        pct = float((amt / total_amount) * 100) if total_amount > Decimal("0.00") else 0.0
        categories_report.append(
            ExpenseCategoryReportItem(
                category_id=cid,
                category_name=cname,
                total_count=cnt,
                total_amount=amt,
                percentage=round(pct, 2)
            )
        )

    # Group Breakdown
    grp_rows = (
        query.with_entities(
            Expense.group_id,
            Group.name,
            func.count(Expense.id).label("grp_count"),
            func.coalesce(func.sum(Expense.amount), Decimal("0.00")).label("grp_amount")
        )
        .group_by(Expense.group_id, Group.name)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    groups_report: List[ExpenseGroupReportItem] = []
    for row in grp_rows:
        gid, gname, cnt, amt = row
        pct = float((amt / total_amount) * 100) if total_amount > Decimal("0.00") else 0.0
        groups_report.append(
            ExpenseGroupReportItem(
                group_id=gid,
                group_name=gname,
                total_count=cnt,
                total_amount=amt,
                percentage=round(pct, 2)
            )
        )

    return ExpenseReportResponse(
        total_amount=total_amount,
        total_count=total_count,
        categories=categories_report,
        groups=groups_report,
        start_date=start_date,
        end_date=end_date
    )


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
    if exp_in.amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expense amount must be strictly greater than 0."
        )

    # 1. Validate Group and acquire row lock
    group = db.query(Group).filter(Group.id == exp_in.group_id).with_for_update(of=Group).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target Group does not exist")

    # 2. Check balance before proceeding
    available_balance = AccountingService.get_group_current_balance(db, group.id)
    if available_balance < exp_in.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient group balance. {group.name} has only ৳{available_balance:,.2f} available, but ৳{exp_in.amount:,.2f} was requested."
        )

    # 3. Validate Category
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == exp_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Expense Category does not exist")

    # 4. Handle optional description / note
    desc = (exp_in.description or "").strip()
    if not desc:
        if exp_in.notes and exp_in.notes.strip():
            desc = exp_in.notes.strip()[:200]
        else:
            desc = f"{cat.name} expense"

    # 5. Create atomic Financial Transaction (updates balance & writes double-entry journal)
    txn = AccountingService.create_transaction(
        db=db,
        group_id=group.id,
        transaction_type="EXPENSE",
        flow_type="OUTFLOW",
        amount=exp_in.amount,
        description=f"Expense [{cat.name}]: {desc}",
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
        description=desc,
        notes=exp_in.notes,
        transaction_id=txn.id,
        created_by_id=current_user.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Invalidate cache
    cache.invalidate_financial_caches(group.id)

    # Internal Audit Log
    AuditService.log(
        db,
        action="CREATE",
        module="expenses",
        record_id=str(expense.id),
        user=current_user,
        new_values={
            "expense_number": expense.expense_number,
            "group": group.name,
            "category": cat.name,
            "amount": str(expense.amount),
        },
    )
    db.commit()
    return expense


@router.post("/{expense_id}/reverse", response_model=ExpenseResponse)
def reverse_expense(
    expense_id: int,
    reversal_in: ExpenseReversalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.create"))
) -> Any:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    if not expense.transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No financial transaction found for this expense"
        )

    if expense.transaction.is_reversed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expense transaction has already been reversed"
        )

    reversal_reason = reversal_in.reason.strip() if reversal_in.reason else "Manual administrative expense reversal"
    AccountingService.reverse_transaction(
        db=db,
        transaction_id=expense.transaction_id,
        user_id=current_user.id,
        reversal_reason=reversal_reason
    )
    db.commit()
    db.refresh(expense)

    AuditService.log(
        db,
        action="REVERSE",
        module="expenses",
        record_id=str(expense.id),
        user=current_user,
        new_values={
            "expense_number": expense.expense_number,
            "reason": reversal_reason,
            "amount": str(expense.amount),
        }
    )
    db.commit()
    return expense

