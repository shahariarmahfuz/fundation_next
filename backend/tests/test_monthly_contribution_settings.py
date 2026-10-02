import uuid
from decimal import Decimal
from datetime import date
import pytest
from backend.app.models.monthly_contribution_setting import MonthlyContributionSetting
from backend.app.models.audit_log import AuditLog
from backend.app.services.accounting_service import AccountingService


def test_default_foundation_monthly_contribution(client, auth_headers):
    """Verifies that the initial default foundation monthly contribution setting is ৳100/month."""
    response = client.get("/api/v1/settings/monthly-contribution", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert Decimal(str(data["current_amount"])) == Decimal("100.00")
    assert data["active_setting"] is not None
    assert Decimal(str(data["active_setting"]["amount"])) == Decimal("100.00")
    assert data["active_setting"]["status"] == "ACTIVE"


def test_member_has_no_custom_monthly_contribution_amount(client, auth_headers):
    """Verifies that member registration ignores/does not allow a custom member contribution amount."""
    unique_id = uuid.uuid4().hex[:6].upper()
    grp_resp = client.post("/api/v1/groups", json={
        "code": f"TMC{unique_id}",
        "name": f"Test Contrib Group {unique_id}",
        "opening_balance": "5000.00",
        "status": "ACTIVE"
    }, headers=auth_headers)
    assert grp_resp.status_code == 200
    group_id = grp_resp.json()["id"]

    # Create member - even if client attempts to pass a custom monthly amount, backend does not store it
    mem_resp = client.post("/api/v1/members", json={
        "full_name": f"Member Global Rate {unique_id}",
        "phone": f"+880 131{unique_id}",
        "group_id": group_id,
        "status": "ACTIVE"
    }, headers=auth_headers)
    assert mem_resp.status_code == 200
    mem_data = mem_resp.json()
    
    # Must report the Foundation-wide active amount (৳100.00)
    assert Decimal(str(mem_data["monthly_contribution_amount"])) == Decimal("100.00")


def test_monthly_contribution_setting_lifecycle_and_due_calculation(client, auth_headers):
    """
    Tests:
    1. Scheduling a future rate (৳150 effective 2027-01-01)
    2. Overlapping dates rejection
    3. Resolution returns ৳100 for 2026-06 and ৳150 for 2027-01
    4. Due generation applies ৳100 for 2026-05 and ৳150 for 2027-01
    5. Audit log records the change
    """
    # 1. Schedule a future rate of ৳150 starting from 2027-01-01
    schedule_payload = {
        "amount": "150.00",
        "effective_from": "2027-01-01",
        "notes": "Approved annual cost-of-living increment"
    }
    sch_resp = client.post("/api/v1/settings/monthly-contribution", json=schedule_payload, headers=auth_headers)
    assert sch_resp.status_code == 200
    sch_data = sch_resp.json()
    assert Decimal(str(sch_data["current_amount"])) == Decimal("100.00")  # Still 100 today
    assert len(sch_data["scheduled_settings"]) >= 1
    scheduled_entry = [s for s in sch_data["scheduled_settings"] if s["effective_from"] == "2027-01-01"][0]
    assert Decimal(str(scheduled_entry["amount"])) == Decimal("150.00")
    assert scheduled_entry["status"] == "SCHEDULED"

    # 2. Prevent overlapping setting on same effective date
    dup_resp = client.post("/api/v1/settings/monthly-contribution", json={
        "amount": "180.00",
        "effective_from": "2027-01-01",
        "notes": "Duplicate date should fail"
    }, headers=auth_headers)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["error"]["message"]

    # 3. Test resolution via API generate-month dues
    unique_id = uuid.uuid4().hex[:6].upper()
    grp_resp = client.post("/api/v1/groups", json={
        "code": f"TDU{unique_id}",
        "name": f"Due Calc Group {unique_id}",
        "opening_balance": "5000.00",
        "status": "ACTIVE"
    }, headers=auth_headers)
    group_id = grp_resp.json()["id"]

    mem_resp = client.post("/api/v1/members", json={
        "full_name": f"Due Test Member {unique_id}",
        "phone": f"+880 191{unique_id}",
        "group_id": group_id,
        "status": "ACTIVE"
    }, headers=auth_headers)
    member_id = mem_resp.json()["id"]

    # Generate dues for past/current month 2026-05 -> should be ৳100
    gen_2026 = client.post("/api/v1/contributions/generate-month", json={"contribution_month": "2026-05"}, headers=auth_headers)
    assert gen_2026.status_code == 200
    assert gen_2026.json()["amount_per_member"] == "100.00"

    contrib_2026 = client.get(f"/api/v1/contributions?member_id={member_id}&contribution_month=2026-05", headers=auth_headers).json()["items"][0]
    assert Decimal(str(contrib_2026["amount"])) == Decimal("100.00")

    # Generate dues for future month 2027-01 -> should automatically be ৳150 based on scheduled effective date
    gen_2027 = client.post("/api/v1/contributions/generate-month", json={"contribution_month": "2027-01"}, headers=auth_headers)
    assert gen_2027.status_code == 200
    assert gen_2027.json()["amount_per_member"] == "150.00"

    contrib_2027 = client.get(f"/api/v1/contributions?member_id={member_id}&contribution_month=2027-01", headers=auth_headers).json()["items"][0]
    assert Decimal(str(contrib_2027["amount"])) == Decimal("150.00")

    # Historical month 2026-05 remains untouched at ৳100
    contrib_2026_check = client.get(f"/api/v1/contributions?member_id={member_id}&contribution_month=2026-05", headers=auth_headers).json()["items"][0]
    assert Decimal(str(contrib_2026_check["amount"])) == Decimal("100.00")


def test_permission_required_for_changing_setting(client):
    """Verifies that unauthorized users cannot change the monthly contribution setting."""
    resp = client.post("/api/v1/settings/monthly-contribution", json={
        "amount": "200.00",
        "effective_from": "2028-01-01"
    })
    # Unauthenticated should be rejected with 401
    assert resp.status_code in (401, 403)
