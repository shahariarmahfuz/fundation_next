from decimal import Decimal
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models.expense import ExpenseCategory, Expense
from backend.app.models.user import User
from backend.app.schemas.expense import (
    ExpenseCategoryResponse,
    ExpenseCategoryCreate,
    ExpenseCategoryUpdate
)
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=List[ExpenseCategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.view"))
) -> Any:
    categories = db.query(ExpenseCategory).order_by(ExpenseCategory.name).all()
    if not categories:
        return []

    # Aggregate stats per category
    stats = (
        db.query(
            Expense.category_id,
            func.count(Expense.id).label("total_expenses"),
            func.coalesce(func.sum(Expense.amount), Decimal("0.00")).label("total_amount")
        )
        .group_by(Expense.category_id)
        .all()
    )
    stats_map = {row.category_id: (row.total_expenses, row.total_amount) for row in stats}

    results = []
    for cat in categories:
        cnt, amt = stats_map.get(cat.id, (0, Decimal("0.00")))
        results.append(
            ExpenseCategoryResponse(
                id=cat.id,
                name=cat.name,
                description=cat.description,
                is_active=cat.is_active,
                created_at=cat.created_at,
                updated_at=cat.updated_at,
                total_expenses=cnt,
                total_amount=amt
            )
        )
    return results


@router.get("/{cat_id}", response_model=ExpenseCategoryResponse)
def get_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.view"))
) -> Any:
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    stat = (
        db.query(
            func.count(Expense.id).label("total_expenses"),
            func.coalesce(func.sum(Expense.amount), Decimal("0.00")).label("total_amount")
        )
        .filter(Expense.category_id == cat_id)
        .first()
    )
    cnt = stat[0] if stat else 0
    amt = stat[1] if stat else Decimal("0.00")

    return ExpenseCategoryResponse(
        id=cat.id,
        name=cat.name,
        description=cat.description,
        is_active=cat.is_active,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
        total_expenses=cnt,
        total_amount=amt
    )



@router.post("", response_model=ExpenseCategoryResponse)
def create_category(
    cat_in: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.create"))
) -> Any:
    existing = db.query(ExpenseCategory).filter(ExpenseCategory.name == cat_in.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already exists")

    cat = ExpenseCategory(name=cat_in.name, description=cat_in.description, is_active=cat_in.is_active)
    db.add(cat)
    db.commit()
    db.refresh(cat)

    AuditService.log(
        db, action="CREATE", module="expense_categories", record_id=str(cat.id),
        user=current_user, new_values={"name": cat.name}
    )
    db.commit()
    return cat


@router.put("/{cat_id}", response_model=ExpenseCategoryResponse)
def update_category(
    cat_id: int,
    cat_in: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("expenses.create"))
) -> Any:
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if cat_in.name and cat_in.name != cat.name:
        existing = db.query(ExpenseCategory).filter(ExpenseCategory.name == cat_in.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already exists")
        cat.name = cat_in.name

    if cat_in.description is not None:
        cat.description = cat_in.description
    if cat_in.is_active is not None:
        cat.is_active = cat_in.is_active

    db.commit()
    db.refresh(cat)
    AuditService.log(
        db, action="UPDATE", module="expense_categories", record_id=str(cat.id),
        user=current_user, new_values={"name": cat.name, "is_active": cat.is_active}
    )
    db.commit()
    return cat
