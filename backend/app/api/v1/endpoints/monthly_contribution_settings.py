from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.monthly_contribution_setting import MonthlyContributionSetting
from backend.app.models.user import User
from backend.app.schemas.monthly_contribution_setting import (
    MonthlyContributionSettingCreate,
    MonthlyContributionOverviewResponse,
    MonthlyContributionSettingResponse
)
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=MonthlyContributionOverviewResponse)
def get_monthly_contribution_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Returns the Foundation Monthly Contribution overview:
    - Current active amount
    - Effective date of active setting
    - Active setting details
    - Scheduled future settings
    - Complete history of settings
    """
    return AccountingService.get_monthly_contribution_overview(db)


@router.post("", response_model=MonthlyContributionOverviewResponse)
def create_monthly_contribution_setting(
    setting_in: MonthlyContributionSettingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings.manage"))
) -> Any:
    """
    Creates or schedules a new Foundation Monthly Contribution setting.
    Protected by 'settings.manage' permission.
    Strictly validates to prevent invalid overlapping effective dates.
    """
    if setting_in.amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly contribution amount must be strictly greater than 0"
        )

    # Prevent invalid overlapping settings for the same effective date
    existing = db.query(MonthlyContributionSetting).filter(
        MonthlyContributionSetting.effective_from == setting_in.effective_from
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A monthly contribution setting already exists effective from {setting_in.effective_from}. Ambiguous overlapping settings are not permitted."
        )

    # Retrieve current active amount before change for audit logging
    previous_amount = AccountingService.get_monthly_contribution_amount(db)

    new_setting = MonthlyContributionSetting(
        amount=setting_in.amount,
        effective_from=setting_in.effective_from,
        notes=setting_in.notes,
        created_by_id=current_user.id,
        updated_by_id=current_user.id
    )
    db.add(new_setting)
    db.commit()
    db.refresh(new_setting)

    # Invalidate cached settings
    cache.delete("org:settings")

    # Record comprehensive audit log
    AuditService.log(
        db=db,
        action="UPDATE",
        module="settings",
        record_id=str(new_setting.id),
        user=current_user,
        old_values={"previous_monthly_contribution_amount": str(previous_amount)},
        new_values={
            "amount": str(new_setting.amount),
            "effective_from": str(new_setting.effective_from),
            "notes": new_setting.notes
        },
        details=f"Admin changed Monthly Contribution: ৳{previous_amount} → ৳{new_setting.amount}, Effective from {new_setting.effective_from}"
    )
    db.commit()

    return AccountingService.get_monthly_contribution_overview(db)
