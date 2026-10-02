from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.expense import ExpenseCategory
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
    return db.query(ExpenseCategory).order_by(ExpenseCategory.name).all()


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
