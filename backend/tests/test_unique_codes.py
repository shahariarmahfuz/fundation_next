import uuid
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.group import Group
from backend.app.models.member import Member
from backend.app.models.beneficiary import Beneficiary


def test_auto_code_generation_sequences(client: TestClient, auth_headers: dict, db_session: Session):
    """
    Test auto-generation with prefixes:
    Member -> M-XXXX
    Group -> G-XXXX
    Beneficiary -> B-XXXX
    """
    uid = uuid.uuid4().hex[:6].upper()

    # 1. Create a group without code -> should auto-generate G-XXXX
    res_g1 = client.post("/api/v1/groups", json={
        "name": f"Auto Group Alpha {uid}",
        "description": "Test group for auto code",
        "opening_balance": 1000.00
    }, headers=auth_headers)
    assert res_g1.status_code == 200, res_g1.text
    g1_data = res_g1.json()
    assert g1_data["code"].startswith("G-")
    assert len(g1_data["code"]) >= 6  # e.g. G-0001

    # 2. Create another group without code -> should get next serial G-XXXX
    res_g2 = client.post("/api/v1/groups", json={
        "name": f"Auto Group Beta {uid}",
        "description": "Second test group for auto code"
    }, headers=auth_headers)
    assert res_g2.status_code == 200, res_g2.text
    g2_data = res_g2.json()
    assert g2_data["code"].startswith("G-")
    assert g2_data["code"] != g1_data["code"]

    # 3. Create a member without code -> should auto-generate M-XXXX
    res_m1 = client.post("/api/v1/members", json={
        "full_name": f"Member Alpha {uid}",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": g1_data["id"]
    }, headers=auth_headers)
    assert res_m1.status_code == 200, res_m1.text
    m1_data = res_m1.json()
    assert m1_data["member_number"].startswith("M-")
    assert len(m1_data["member_number"]) >= 6  # e.g. M-0001

    # 4. Create another member without code -> should get next serial M-XXXX
    res_m2 = client.post("/api/v1/members", json={
        "full_name": f"Member Beta {uid}",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": g1_data["id"]
    }, headers=auth_headers)
    assert res_m2.status_code == 200, res_m2.text
    m2_data = res_m2.json()
    assert m2_data["member_number"].startswith("M-")
    assert m2_data["member_number"] != m1_data["member_number"]

    # 5. Create a beneficiary without code -> should auto-generate B-XXXX
    res_b1 = client.post("/api/v1/beneficiaries", json={
        "name": f"Beneficiary Alpha {uid}",
        "phone": f"+88018{uuid.uuid4().int % 100000000:08d}"
    }, headers=auth_headers)
    assert res_b1.status_code == 200, res_b1.text
    b1_data = res_b1.json()
    assert b1_data["beneficiary_number"].startswith("B-")
    assert len(b1_data["beneficiary_number"]) >= 6  # e.g. B-0001

    # 6. Create another beneficiary without code -> should get next serial B-XXXX
    res_b2 = client.post("/api/v1/beneficiaries", json={
        "name": f"Beneficiary Beta {uid}",
        "phone": f"+88018{uuid.uuid4().int % 100000000:08d}"
    }, headers=auth_headers)
    assert res_b2.status_code == 200, res_b2.text
    b2_data = res_b2.json()
    assert b2_data["beneficiary_number"].startswith("B-")
    assert b2_data["beneficiary_number"] != b1_data["beneficiary_number"]


def test_custom_valid_codes(client: TestClient, auth_headers: dict, db_session: Session):
    """
    Test manual custom codes with valid prefixes:
    Member: M-0100, M-9999
    Group: G-5000
    Beneficiary: B-2026-001
    """
    uid = uuid.uuid4().hex[:4].upper()
    g_code = f"G-5{uid}"
    m_code = f"M-01{uid}"
    b_code = f"B-2026-{uid}"

    # 1. Custom Group code G-5XXX
    res_g = client.post("/api/v1/groups", json={
        "code": g_code,
        "name": f"Group Custom {uid}",
    }, headers=auth_headers)
    assert res_g.status_code == 200, res_g.text
    assert res_g.json()["code"] == g_code

    # 2. Custom Member code M-01XX
    res_m = client.post("/api/v1/members", json={
        "code": m_code,
        "full_name": f"Member Custom {uid}",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": res_g.json()["id"]
    }, headers=auth_headers)
    assert res_m.status_code == 200, res_m.text
    assert res_m.json()["member_number"] == m_code

    # 3. Custom Beneficiary code B-2026-XXX
    res_b = client.post("/api/v1/beneficiaries", json={
        "code": b_code,
        "name": f"Beneficiary Custom {uid}",
        "phone": f"+88018{uuid.uuid4().int % 100000000:08d}"
    }, headers=auth_headers)
    assert res_b.status_code == 200, res_b.text
    assert res_b.json()["beneficiary_number"] == b_code


def test_prefix_validation(client: TestClient, auth_headers: dict, db_session: Session):
    """
    Test that invalid prefixes return clean HTTP 400 Bad Request, not 500.
    """
    test_group = db_session.query(Group).first()
    assert test_group is not None

    # Member with G- prefix or invalid prefix
    res = client.post("/api/v1/members", json={
        "code": "G-9999",
        "full_name": "Invalid Member Prefix",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": test_group.id
    }, headers=auth_headers)
    assert res.status_code == 400
    detail = res.json().get("detail") or res.json().get("error", {}).get("message", "")
    assert "Member code must start with prefix 'M-'" in detail

    # Group with M- prefix or invalid prefix
    res = client.post("/api/v1/groups", json={
        "code": "M-8888",
        "name": f"Invalid Group Prefix {uuid.uuid4().hex[:4]}"
    }, headers=auth_headers)
    assert res.status_code == 400
    detail = res.json().get("detail") or res.json().get("error", {}).get("message", "")
    assert "Group code must start with prefix 'G-'" in detail

    # Beneficiary with M- prefix or invalid prefix
    res = client.post("/api/v1/beneficiaries", json={
        "code": "M-7777",
        "name": "Invalid Beneficiary Prefix",
        "phone": f"+88018{uuid.uuid4().int % 100000000:08d}"
    }, headers=auth_headers)
    assert res.status_code == 400
    detail = res.json().get("detail") or res.json().get("error", {}).get("message", "")
    assert "Beneficiary code must start with prefix 'B-'" in detail


def test_duplicate_code_rejection(client: TestClient, auth_headers: dict, db_session: Session):
    """
    Test duplicate codes return clean HTTP 400 Bad Request (never HTTP 500).
    """
    test_group = db_session.query(Group).first()
    dup_code = f"M-DUP{uuid.uuid4().hex[:4].upper()}"

    # Create Member with dup_code
    res1 = client.post("/api/v1/members", json={
        "code": dup_code,
        "full_name": "Original Member",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": test_group.id
    }, headers=auth_headers)
    assert res1.status_code == 200

    # Try duplicate uppercase
    res2 = client.post("/api/v1/members", json={
        "code": dup_code,
        "full_name": "Duplicate Member",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": test_group.id
    }, headers=auth_headers)
    assert res2.status_code == 400
    detail2 = res2.json().get("detail") or res2.json().get("error", {}).get("message", "")
    assert "already exists" in detail2.lower()

    # Try duplicate lowercase
    res3 = client.post("/api/v1/members", json={
        "code": dup_code.lower(),
        "full_name": "Duplicate Lowercase Member",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": test_group.id
    }, headers=auth_headers)
    assert res3.status_code == 400
    detail3 = res3.json().get("detail") or res3.json().get("error", {}).get("message", "")
    assert "already exists" in detail3.lower()


def test_custom_code_does_not_break_serial_sequence(client: TestClient, auth_headers: dict, db_session: Session):
    """
    Test that creating a custom code (e.g. M-8000) does not cause the auto sequence to jump to 8001.
    """
    test_group = db_session.query(Group).first()

    # Create an auto-generated member
    res_a1 = client.post("/api/v1/members", json={
        "full_name": "Auto Seq 1",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": test_group.id
    }, headers=auth_headers)
    assert res_a1.status_code == 200, res_a1.text
    m_auto1 = res_a1.json()
    num1 = int(m_auto1["member_number"].replace("M-", ""))

    # Create a custom member with large number M-8888...
    custom_large = f"M-8{uuid.uuid4().int % 1000:03d}"
    res_c = client.post("/api/v1/members", json={
        "code": custom_large,
        "full_name": "High Custom",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": test_group.id
    }, headers=auth_headers)
    assert res_c.status_code == 200, res_c.text
    assert res_c.json()["member_number"] == custom_large

    # Next auto-generated member should still follow natural sequence (num1 + 1), NOT jump!
    res_a2 = client.post("/api/v1/members", json={
        "full_name": "Auto Seq 2",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": test_group.id
    }, headers=auth_headers)
    assert res_a2.status_code == 200, res_a2.text
    m_auto2 = res_a2.json()
    num2 = int(m_auto2["member_number"].replace("M-", ""))
    assert num2 == num1 + 1


def test_code_editing_and_audit(client: TestClient, auth_headers: dict, db_session: Session):
    """
    Test editing entity codes:
    - Valid code update succeeds
    - Foreign keys and relationships remain intact
    - Invalid prefix or duplicate code is rejected with 400
    """
    test_group = db_session.query(Group).first()
    uid = uuid.uuid4().hex[:4].upper()
    edit_code = f"M-7{uid}"

    # Create a member
    mem = client.post("/api/v1/members", json={
        "full_name": "Editable Code Member",
        "phone": f"+88017{uuid.uuid4().int % 100000000:08d}",
        "group_id": test_group.id
    }, headers=auth_headers).json()

    # Update code to valid new custom code
    res_update = client.put(f"/api/v1/members/{mem['id']}", json={
        "code": edit_code
    }, headers=auth_headers)
    assert res_update.status_code == 200, res_update.text
    assert res_update.json()["member_number"] == edit_code

    # Verify relationships remain linked
    res_fetch = client.get(f"/api/v1/members/{mem['id']}", headers=auth_headers)
    assert res_fetch.status_code == 200
    assert res_fetch.json()["group"]["id"] == test_group.id

    # Attempt to update to invalid prefix
    res_bad_prefix = client.put(f"/api/v1/members/{mem['id']}", json={
        "code": "G-7001"
    }, headers=auth_headers)
    assert res_bad_prefix.status_code == 400
    detail = res_bad_prefix.json().get("detail") or res_bad_prefix.json().get("error", {}).get("message", "")
    assert "Member code must start with prefix 'M-'" in detail
