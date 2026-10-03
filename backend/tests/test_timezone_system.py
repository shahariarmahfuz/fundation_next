import pytest
from datetime import datetime, date, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.services.timezone_service import TimezoneService, DEFAULT_TIMEZONE
from backend.app.models.organization import Organization


def test_timezone_validation():
    # Valid IANA database identifiers
    valid_zones = [
        "Asia/Dhaka",
        "Asia/Kolkata",
        "Asia/Dubai",
        "Asia/Riyadh",
        "Europe/London",
        "America/New_York",
        "America/Los_Angeles",
        "UTC"
    ]
    for z in valid_zones:
        assert TimezoneService.is_valid_timezone(z) is True, f"Expected {z} to be valid"

    # Invalid timezones or raw UTC offsets (strictly prohibited)
    invalid_zones = [
        "UTC+6",
        "UTC+06:00",
        "GMT+6",
        "Dhaka",
        "Bangladesh/Dhaka",
        "Invalid/Timezone",
        "",
        None,
        123
    ]
    for z in invalid_zones:
        assert TimezoneService.is_valid_timezone(z) is False, f"Expected {z} to be invalid"


def test_time_preview_formatting():
    preview = TimezoneService.get_time_preview("Asia/Dhaka")
    assert preview["timezone"] == "Asia/Dhaka"
    assert preview["utc_offset"] == "UTC+06:00"
    assert "formatted" in preview
    assert "date_only" in preview
    assert "time_only" in preview

    # Test preview formatting structure e.g. "03 October 2026, 10:30 PM"
    formatted = preview["formatted"]
    parts = formatted.split(", ")
    assert len(parts) == 2, f"Formatted time should have date and time separated by comma: {formatted}"
    date_part, time_part = parts
    assert len(date_part.split(" ")) == 3  # "03 October 2026"
    assert any(time_part.endswith(suffix) for suffix in ["AM", "PM"])


def test_get_settings_timezone_api(client: TestClient):
    res = client.get("/api/v1/settings/timezone")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "timezone" in data
    assert "utc_offset" in data
    assert "formatted" in data
    assert "common_timezones" in data
    assert len(data["common_timezones"]) > 5
    assert "all_timezones" in data
    assert len(data["all_timezones"]) > 50


def test_preview_timezone_api(client: TestClient):
    # Valid timezone preview
    res = client.get("/api/v1/settings/timezone/preview?tz=Europe/London")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["timezone"] == "Europe/London"
    assert "utc_offset" in data
    assert "formatted" in data

    # Invalid timezone rejected with 400
    res_bad = client.get("/api/v1/settings/timezone/preview?tz=UTC%2B6")
    assert res_bad.status_code == 400
    assert "Invalid IANA timezone" in res_bad.json()["detail"]


def test_update_settings_timezone_api(client: TestClient, auth_headers: dict, db_session: Session):
    # Reject invalid timezone
    res_bad = client.put(
        "/api/v1/settings/timezone",
        json={"timezone": "UTC+6"},
        headers=auth_headers
    )
    assert res_bad.status_code == 400
    assert "Must be a valid IANA database identifier" in res_bad.json()["detail"]

    # Update to America/New_York
    res_ny = client.put(
        "/api/v1/settings/timezone",
        json={"timezone": "America/New_York"},
        headers=auth_headers
    )
    assert res_ny.status_code == 200
    assert res_ny.json()["timezone"] == "America/New_York"

    # Expire test session identity map to reflect endpoint's committed changes
    db_session.expire_all()
    assert TimezoneService.get_foundation_timezone_name(db_session) == "America/New_York"
    org = db_session.query(Organization).first()
    assert org.timezone == "America/New_York"

    # Revert back to Asia/Dhaka
    res_dhaka = client.put(
        "/api/v1/settings/timezone",
        json={"timezone": "Asia/Dhaka"},
        headers=auth_headers
    )
    assert res_dhaka.status_code == 200
    assert res_dhaka.json()["timezone"] == "Asia/Dhaka"

    db_session.expire_all()
    assert TimezoneService.get_foundation_timezone_name(db_session) == "Asia/Dhaka"


def test_organization_put_timezone_validation(client: TestClient, auth_headers: dict):
    # Update organization with invalid timezone
    res_bad = client.put(
        "/api/v1/organization",
        json={"timezone": "InvalidZone/NotReal"},
        headers=auth_headers
    )
    assert res_bad.status_code == 400
    assert "Invalid IANA timezone" in res_bad.json()["detail"]


def test_timezone_calendar_conversions(db_session: Session):
    # Test date_start_utc and date_end_utc
    d = date(2026, 10, 3)
    start_utc = TimezoneService.date_start_utc(d, "Asia/Dhaka")
    end_utc = TimezoneService.date_end_utc(d, "Asia/Dhaka")

    # In Asia/Dhaka (UTC+6), midnight 2026-10-03 is 2026-10-02 18:00:00 UTC
    assert start_utc.year == 2026
    assert start_utc.month == 10
    assert start_utc.day == 2
    assert start_utc.hour == 18
    assert start_utc.minute == 0

    # End of day 23:59:59.999999 in Dhaka is 17:59:59.999999 UTC
    assert end_utc.year == 2026
    assert end_utc.month == 10
    assert end_utc.day == 3
    assert end_utc.hour == 17
    assert end_utc.minute == 59
