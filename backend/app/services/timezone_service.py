import zoneinfo
import logging
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.core.cache import cache

logger = logging.getLogger(__name__)

DEFAULT_TIMEZONE = "Asia/Dhaka"

# Curated list of popular / common IANA timezones with clear regional labels
COMMON_TIMEZONES: List[Dict[str, str]] = [
    {"identifier": "Asia/Dhaka", "label": "Asia/Dhaka — Bangladesh (UTC+6)"},
    {"identifier": "Asia/Kolkata", "label": "Asia/Kolkata — India (UTC+5:30)"},
    {"identifier": "Asia/Dubai", "label": "Asia/Dubai — UAE (UTC+4)"},
    {"identifier": "Asia/Riyadh", "label": "Asia/Riyadh — Saudi Arabia (UTC+3)"},
    {"identifier": "Asia/Qatar", "label": "Asia/Qatar — Qatar (UTC+3)"},
    {"identifier": "Asia/Karachi", "label": "Asia/Karachi — Pakistan (UTC+5)"},
    {"identifier": "Asia/Singapore", "label": "Asia/Singapore — Singapore (UTC+8)"},
    {"identifier": "Asia/Kuala_Lumpur", "label": "Asia/Kuala_Lumpur — Malaysia (UTC+8)"},
    {"identifier": "Asia/Jakarta", "label": "Asia/Jakarta — Indonesia (UTC+7)"},
    {"identifier": "Asia/Tokyo", "label": "Asia/Tokyo — Japan (UTC+9)"},
    {"identifier": "Europe/London", "label": "Europe/London — United Kingdom (UTC+0/+1)"},
    {"identifier": "Europe/Berlin", "label": "Europe/Berlin — Germany (UTC+1/+2)"},
    {"identifier": "Europe/Paris", "label": "Europe/Paris — France (UTC+1/+2)"},
    {"identifier": "Europe/Istanbul", "label": "Europe/Istanbul — Turkey (UTC+3)"},
    {"identifier": "America/New_York", "label": "America/New_York — United States (Eastern, UTC-5/-4)"},
    {"identifier": "America/Chicago", "label": "America/Chicago — United States (Central, UTC-6/-5)"},
    {"identifier": "America/Denver", "label": "America/Denver — United States (Mountain, UTC-7/-6)"},
    {"identifier": "America/Los_Angeles", "label": "America/Los_Angeles — United States (Pacific, UTC-8/-7)"},
    {"identifier": "America/Toronto", "label": "America/Toronto — Canada (Eastern, UTC-5/-4)"},
    {"identifier": "Australia/Sydney", "label": "Australia/Sydney — Australia (UTC+10/+11)"},
    {"identifier": "Africa/Cairo", "label": "Africa/Cairo — Egypt (UTC+2/+3)"},
    {"identifier": "UTC", "label": "UTC — Coordinated Universal Time (UTC+0)"},
]


class TimezoneService:
    CACHE_KEY = "foundation:timezone"

    @classmethod
    def is_valid_timezone(cls, tz_name: str) -> bool:
        """Check if an IANA timezone identifier is valid."""
        if not tz_name or not isinstance(tz_name, str):
            return False
        try:
            zoneinfo.ZoneInfo(tz_name.strip())
            return True
        except Exception:
            return False

    @classmethod
    def get_foundation_timezone_name(cls, db: Optional[Session] = None) -> str:
        """
        Get the configured global Foundation timezone string (e.g. 'Asia/Dhaka').
        Checks Redis cache first. If not cached, fetches from organizations table.
        """
        cached = cache.get(cls.CACHE_KEY)
        if cached and isinstance(cached, str):
            return cached

        if db is not None:
            try:
                from backend.app.models.organization import Organization
                org = db.query(Organization).first()
                if org and org.timezone and cls.is_valid_timezone(org.timezone):
                    tz = org.timezone.strip()
                    cache.set(cls.CACHE_KEY, tz, expire_seconds=3600)
                    return tz
            except Exception as e:
                logger.warning(f"Failed to query organization timezone from db: {e}")

        # Fallback to default
        return DEFAULT_TIMEZONE

    @classmethod
    def clear_cache(cls) -> None:
        """Clear timezone cache when super admin updates timezone."""
        cache.delete(cls.CACHE_KEY)
        cache.delete("org:settings")

    @classmethod
    def get_zoneinfo(cls, db_or_tz: Any = None) -> zoneinfo.ZoneInfo:
        """
        Get a zoneinfo.ZoneInfo object for the configured foundation timezone
        or for a specific timezone name string.
        """
        if isinstance(db_or_tz, str) and cls.is_valid_timezone(db_or_tz):
            return zoneinfo.ZoneInfo(db_or_tz.strip())
        
        db = db_or_tz if isinstance(db_or_tz, Session) else None
        tz_name = cls.get_foundation_timezone_name(db)
        try:
            return zoneinfo.ZoneInfo(tz_name)
        except Exception:
            return zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)

    @classmethod
    def utc_now(cls) -> datetime:
        """Get current timestamp in UTC (standard for database storage)."""
        return datetime.now(timezone.utc)

    @classmethod
    def now(cls, db: Optional[Session] = None) -> datetime:
        """Get current datetime in the configured Foundation timezone."""
        zi = cls.get_zoneinfo(db)
        return datetime.now(timezone.utc).astimezone(zi)

    @classmethod
    def today(cls, db: Optional[Session] = None) -> date:
        """
        Get today's calendar date in the configured Foundation timezone.
        Ensures transactions, expenses, repayments, and donations match the
        foundation's local calendar day rather than the server's OS clock.
        """
        return cls.now(db).date()

    @classmethod
    def current_month(cls, db: Optional[Session] = None) -> str:
        """Get current month string 'YYYY-MM' in the Foundation timezone."""
        return cls.now(db).strftime("%Y-%m")

    @classmethod
    def current_year(cls, db: Optional[Session] = None) -> int:
        """Get current calendar year in the Foundation timezone."""
        return cls.now(db).year

    @classmethod
    def date_start_utc(cls, d: date, db: Optional[Session] = None) -> datetime:
        """
        Given a calendar date in the Foundation's timezone, returns the UTC datetime
        corresponding to the start of that day (00:00:00) in the Foundation timezone.
        """
        zi = cls.get_zoneinfo(db)
        local_dt = datetime.combine(d, datetime.min.time(), tzinfo=zi)
        return local_dt.astimezone(timezone.utc)

    @classmethod
    def date_end_utc(cls, d: date, db: Optional[Session] = None) -> datetime:
        """
        Given a calendar date in the Foundation's timezone, returns the UTC datetime
        corresponding to the end of that day (23:59:59.999999) in the Foundation timezone.
        """
        zi = cls.get_zoneinfo(db)
        local_dt = datetime.combine(d, datetime.max.time(), tzinfo=zi)
        return local_dt.astimezone(timezone.utc)

    @classmethod
    def to_foundation_tz(cls, dt: datetime, db: Optional[Session] = None) -> datetime:
        """
        Convert any datetime to the configured Foundation timezone.
        If dt is naive, it is assumed to be UTC.
        """
        if dt is None:
            return None
        zi = cls.get_zoneinfo(db)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(zi)

    @classmethod
    def format_datetime(
        cls,
        dt: Optional[datetime],
        db: Optional[Session] = None,
        fmt: str = "%d %B %Y, %I:%M %p"
    ) -> str:
        """Format a timestamp in the Foundation timezone."""
        if not dt:
            return "-"
        local_dt = cls.to_foundation_tz(dt, db)
        return local_dt.strftime(fmt)

    @classmethod
    def format_date(
        cls,
        d: Optional[Any],
        db: Optional[Session] = None,
        fmt: str = "%d %b %Y"
    ) -> str:
        """Format a date or datetime object in the Foundation timezone."""
        if not d:
            return "-"
        if isinstance(d, datetime):
            return cls.to_foundation_tz(d, db).strftime(fmt)
        if isinstance(d, date):
            return d.strftime(fmt)
        return str(d)

    @classmethod
    def get_time_preview(cls, tz_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a preview of the current time in the specified timezone
        (e.g., '03 October 2026, 10:30 PM').
        """
        target_tz = tz_name if (tz_name and cls.is_valid_timezone(tz_name)) else DEFAULT_TIMEZONE
        zi = zoneinfo.ZoneInfo(target_tz)
        local_now = datetime.now(timezone.utc).astimezone(zi)
        
        # Calculate UTC offset representation (+06:00, etc.)
        offset = local_now.strftime("%z")
        formatted_offset = f"UTC{offset[:3]}:{offset[3:]}" if len(offset) == 5 else "UTC"

        return {
            "timezone": target_tz,
            "utc_offset": formatted_offset,
            "current_time_iso": local_now.isoformat(),
            "formatted": local_now.strftime("%d %B %Y, %I:%M %p"),
            "date_only": local_now.strftime("%Y-%m-%d"),
            "time_only": local_now.strftime("%I:%M %p"),
        }

    @classmethod
    def get_all_timezones(cls) -> List[Dict[str, str]]:
        """Return list of common and available IANA timezones."""
        # Start with common timezones
        result = list(COMMON_TIMEZONES)
        common_ids = {tz["identifier"] for tz in COMMON_TIMEZONES}

        # Add remaining IANA timezones sorted alphabetically
        for tz_id in sorted(zoneinfo.available_timezones()):
            if tz_id not in common_ids and not tz_id.startswith(("Etc/", "SystemV/")):
                result.append({
                    "identifier": tz_id,
                    "label": tz_id.replace("_", " ")
                })

        return result
