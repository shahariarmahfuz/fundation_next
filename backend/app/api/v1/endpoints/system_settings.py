from datetime import datetime, timezone
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.organization import Organization
from backend.app.models.user import User
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.timezone_service import TimezoneService, DEFAULT_TIMEZONE, COMMON_TIMEZONES
from backend.app.services.audit_service import AuditService

router = APIRouter()


class TimezoneUpdateRequest(BaseModel):
    timezone: str


@router.get("/timezone")
def get_system_timezone(
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current configured foundation timezone, live formatted time preview,
    and list of available IANA timezones. Publicly readable.
    """
    current_tz = TimezoneService.get_foundation_timezone_name(db)
    preview = TimezoneService.get_time_preview(current_tz)
    
    return {
        "success": True,
        "timezone": current_tz,
        "utc_offset": preview["utc_offset"],
        "current_time_iso": preview["current_time_iso"],
        "formatted": preview["formatted"],
        "date_only": preview["date_only"],
        "time_only": preview["time_only"],
        "common_timezones": COMMON_TIMEZONES,
        "all_timezones": TimezoneService.get_all_timezones()
    }


@router.get("/timezone/preview")
def preview_system_timezone(
    tz: str = Query(..., description="IANA Timezone Identifier to preview")
) -> Any:
    """
    Preview what the current Foundation time will look like in a given timezone
    before saving it.
    """
    clean_tz = tz.strip()
    if not TimezoneService.is_valid_timezone(clean_tz):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid IANA timezone identifier '{tz}'. Examples: 'Asia/Dhaka', 'Europe/London', 'America/New_York'."
        )
    preview = TimezoneService.get_time_preview(clean_tz)
    return {
        "success": True,
        **preview
    }


@router.put("/timezone")
def update_system_timezone(
    req: TimezoneUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings.manage"))
) -> Any:
    """
    Update global Foundation timezone. Super Admin / settings.manage required.
    Saves to database and invalidates timezone cache immediately.
    """
    new_tz = req.timezone.strip()
    if not TimezoneService.is_valid_timezone(new_tz):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid IANA timezone identifier '{req.timezone}'. Must be a valid IANA database identifier (e.g. 'Asia/Dhaka', 'Asia/Kolkata', 'Europe/London')."
        )

    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Al-Birr Foundation", timezone=new_tz)
        db.add(org)
        db.flush()

    old_tz = org.timezone or DEFAULT_TIMEZONE
    org.timezone = new_tz
    org.updated_by_id = current_user.id
    org.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(org)

    # Invalidate caches
    TimezoneService.clear_cache()

    AuditService.log(
        db,
        action="UPDATE",
        module="system_settings",
        record_id=str(org.id),
        user=current_user,
        details=f"Foundation global timezone changed from '{old_tz}' to '{new_tz}'",
        old_values={"timezone": old_tz},
        new_values={"timezone": new_tz}
    )
    db.commit()

    preview = TimezoneService.get_time_preview(new_tz)
    return {
        "success": True,
        "message": f"Global Foundation timezone successfully set to '{new_tz}'",
        "timezone": new_tz,
        "utc_offset": preview["utc_offset"],
        "current_time_iso": preview["current_time_iso"],
        "formatted": preview["formatted"],
        "date_only": preview["date_only"],
        "time_only": preview["time_only"]
    }
