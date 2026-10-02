import base64
import io
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.group import Group
from backend.app.models.user import User
from backend.app.core.security import create_access_token

client = TestClient(app)

DUMMY_PNG_BYTES = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def admin_headers(db):
    admin = db.query(User).filter(User.username == "admin").first()
    assert admin is not None
    token = create_access_token(subject=admin.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_group(db):
    group = db.query(Group).first()
    assert group is not None
    return group


def test_member_creation_with_valid_document_types(admin_headers, test_group):
    """Verify that only NATIONAL_ID and BIRTH_CERTIFICATE are accepted."""
    # 1. With NATIONAL_ID
    payload_nid = {
        "full_name": "NID Member Test",
        "group_id": test_group.id,
        "document_type": "NATIONAL_ID"
    }
    res_nid = client.post("/api/v1/members", headers=admin_headers, json=payload_nid)
    assert res_nid.status_code in (200, 201)
    assert res_nid.json()["document_type"] == "NATIONAL_ID"

    # 2. With BIRTH_CERTIFICATE
    payload_bc = {
        "full_name": "BC Member Test",
        "group_id": test_group.id,
        "document_type": "BIRTH_CERTIFICATE"
    }
    res_bc = client.post("/api/v1/members", headers=admin_headers, json=payload_bc)
    assert res_bc.status_code in (200, 201)
    assert res_bc.json()["document_type"] == "BIRTH_CERTIFICATE"


def test_member_creation_rejects_obsolete_document_types(admin_headers, test_group):
    """Verify that PASSPORT, DRIVING_LICENSE, OTHER are rejected with 422, NEVER 500."""
    for obsolete_type in ["PASSPORT", "DRIVING_LICENSE", "OTHER", "Passport", "Driving License", "RandomDoc"]:
        payload = {
            "full_name": f"Invalid {obsolete_type} Member",
            "group_id": test_group.id,
            "document_type": obsolete_type
        }
        res = client.post("/api/v1/members", headers=admin_headers, json=payload)
        # Must return 422 Unprocessable Entity (validation error), NEVER 500
        assert res.status_code == 422
        assert "Allowed values are 'NATIONAL_ID' and 'BIRTH_CERTIFICATE'" in str(res.json())


def test_member_upload_documents_strict_categories(admin_headers, test_group):
    """Verify upload endpoint accepts NID_FRONT, NID_BACK, BIRTH_CERTIFICATE and rejects other categories."""
    create_res = client.post(
        "/api/v1/members",
        headers=admin_headers,
        json={"full_name": "Category Test Member", "group_id": test_group.id}
    )
    assert create_res.status_code in (200, 201)
    member_id = create_res.json()["id"]

    # 1. Valid category: NID_FRONT
    file_payload = ("nid_front.png", io.BytesIO(DUMMY_PNG_BYTES), "image/png")
    res_front = client.post(
        f"/api/v1/members/{member_id}/documents",
        headers=admin_headers,
        data={"document_category": "NID_FRONT", "document_type": "NATIONAL_ID"},
        files={"file": file_payload}
    )
    assert res_front.status_code == 200

    # 2. Valid category: BIRTH_CERTIFICATE
    file_payload_bc = ("birth_cert.png", io.BytesIO(DUMMY_PNG_BYTES), "image/png")
    res_bc = client.post(
        f"/api/v1/members/{member_id}/documents",
        headers=admin_headers,
        data={"document_category": "BIRTH_CERTIFICATE", "document_type": "BIRTH_CERTIFICATE"},
        files={"file": file_payload_bc}
    )
    assert res_bc.status_code == 200

    # 3. Invalid category: PASSPORT / OTHER
    file_payload_invalid = ("other.png", io.BytesIO(DUMMY_PNG_BYTES), "image/png")
    res_invalid = client.post(
        f"/api/v1/members/{member_id}/documents",
        headers=admin_headers,
        data={"document_category": "OTHER"},
        files={"file": file_payload_invalid}
    )
    # Must reject with 400 Bad Request, NEVER 500
    assert res_invalid.status_code == 400
    assert "Allowed categories" in res_invalid.json()["detail"]


def test_member_creation_without_any_documents_succeeds(admin_headers, test_group):
    """Confirm only Full Name and Group are required; no document type or document is needed."""
    payload = {
        "full_name": "No Document Member",
        "group_id": test_group.id
    }
    res = client.post("/api/v1/members", headers=admin_headers, json=payload)
    assert res.status_code in (200, 201)
    data = res.json()
    assert data["full_name"] == "No Document Member"
    assert data["document_type"] is None
    assert data["photo_url"] is None
    assert data["signature_url"] is None
