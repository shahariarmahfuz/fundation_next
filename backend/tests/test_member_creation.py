import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.group import Group
from backend.app.models.member import Member


def test_minimal_member_creation_only_name_and_group(client: TestClient, auth_headers: dict, db_session: Session):
    """
    Test creating a member with ONLY full_name and group_id.
    Everything else is empty/null.
    """
    test_group = db_session.query(Group).first()
    assert test_group is not None, "At least one group must exist"

    unique_name = f"Rahim Ahmed {uuid.uuid4().hex[:6]}"

    # Request with ONLY full_name and group_id
    res = client.post("/api/v1/members", json={
        "full_name": unique_name,
        "group_id": test_group.id
    }, headers=auth_headers)

    assert res.status_code == 200, res.text
    data = res.json()

    assert data["full_name"] == unique_name
    assert data["group_id"] == test_group.id
    assert data["member_number"].startswith("M-")
    assert data["status"] == "ACTIVE"

    # Verify optional fields are None / null
    assert data.get("phone") is None
    assert data.get("email") is None
    assert data.get("address") is None
    assert data.get("nid_or_id") is None
    assert data.get("father_name") is None
    assert data.get("mother_name") is None
    assert data.get("emergency_contact_name") is None


def test_missing_full_name_rejected(client: TestClient, auth_headers: dict, db_session: Session):
    """
    Test that creating a member without full_name is rejected with HTTP 400.
    """
    test_group = db_session.query(Group).first()

    # Empty string full_name
    res = client.post("/api/v1/members", json={
        "full_name": "   ",
        "group_id": test_group.id
    }, headers=auth_headers)
    assert res.status_code == 400
    msg = res.json().get("detail") or res.json().get("error", {}).get("message", "")
    assert "full name is required" in msg.lower()


def test_missing_or_invalid_group_rejected(client: TestClient, auth_headers: dict):
    """
    Test that creating a member without valid group_id is rejected.
    """
    # Non-existent group
    res = client.post("/api/v1/members", json={
        "full_name": "No Group Member",
        "group_id": 999999
    }, headers=auth_headers)
    assert res.status_code == 400
    msg = res.json().get("detail") or res.json().get("error", {}).get("message", "")
    assert "group" in msg.lower()


def test_member_creation_with_some_optional_fields(client: TestClient, auth_headers: dict, db_session: Session):
    """
    User enters:
    Full Name: Karim Hasan
    Group: Education Group
    Mobile: 017XXXXXXXX
    Email: karim@example.com
    Everything else empty.
    """
    test_group = db_session.query(Group).first()
    unique_phone = f"+88017{uuid.uuid4().int % 100000000:08d}"
    unique_email = f"karim_{uuid.uuid4().hex[:6]}@example.com"

    res = client.post("/api/v1/members", json={
        "full_name": "Karim Hasan",
        "group_id": test_group.id,
        "phone": unique_phone,
        "email": unique_email
    }, headers=auth_headers)

    assert res.status_code == 200, res.text
    data = res.json()
    assert data["full_name"] == "Karim Hasan"
    assert data["phone"] == unique_phone
    assert data["email"] == unique_email
    assert data["member_number"].startswith("M-")
    assert data.get("father_name") is None
    assert data.get("address") is None


def test_member_creation_with_custom_code(client: TestClient, auth_headers: dict, db_session: Session):
    """
    User enters:
    Full Name: Hasan Ali
    Group: General Group
    Member Code: M-0500...
    """
    test_group = db_session.query(Group).first()
    custom_code = f"M-05{uuid.uuid4().hex[:4].upper()}"

    res = client.post("/api/v1/members", json={
        "full_name": "Hasan Ali",
        "group_id": test_group.id,
        "code": custom_code
    }, headers=auth_headers)

    assert res.status_code == 200, res.text
    data = res.json()
    assert data["full_name"] == "Hasan Ali"
    assert data["member_number"] == custom_code
