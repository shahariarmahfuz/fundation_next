import io
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.organization import Organization
from backend.app.models.audit_log import AuditLog
from backend.app.models.user import User
from backend.app.core.security import create_access_token

client = TestClient(app)

import base64

# Valid 1x1 transparent PNG bytes for testing image upload
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
def non_admin_headers(db):
    # Find or create a user without settings.manage
    user = db.query(User).filter(User.username != "admin").first()
    if not user:
        # Create normal test user
        user = User(
            username="normal_staff_test",
            email="normal_staff_test@example.com",
            hashed_password="hashed_pwd",
            full_name="Staff Test",
            is_active=True,
            is_superuser=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(subject=user.id)
    return {"Authorization": f"Bearer {token}"}


def test_get_organization_public():
    """Verify that organization settings are accessible publicly."""
    response = client.get("/api/v1/organization")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "logo_url" in data
    assert "currency_symbol" in data


def test_update_organization_name(admin_headers, db):
    """Verify that an authorized admin can update the Foundation Name."""
    new_name = "Al-Birr Welfare Foundation"
    response = client.put(
        "/api/v1/organization",
        headers=admin_headers,
        json={"name": new_name, "tagline": "Empowering Communities Ethically"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == new_name

    # Verify audit log was recorded
    audit = db.query(AuditLog).filter(
        AuditLog.module == "organization",
        AuditLog.action == "UPDATE"
    ).order_by(AuditLog.id.desc()).first()
    assert audit is not None
    assert new_name in audit.details


def test_unauthorized_user_cannot_update_branding(non_admin_headers):
    """Verify that an unauthorized user receives 403 Forbidden when trying to update branding."""
    response = client.put(
        "/api/v1/organization",
        headers=non_admin_headers,
        json={"name": "Hacked Foundation"}
    )
    assert response.status_code == 403

    # Cannot upload logo either
    file_payload = ("test_logo.png", io.BytesIO(DUMMY_PNG_BYTES), "image/png")
    response_logo = client.post(
        "/api/v1/organization/logo",
        headers=non_admin_headers,
        files={"file": file_payload}
    )
    assert response_logo.status_code == 403


def test_organization_logo_lifecycle(admin_headers, db):
    """Verify logo upload, replacement, and deletion in Cloudinary."""
    # 1. Upload initial logo
    file_payload = ("foundation_logo_1.png", io.BytesIO(DUMMY_PNG_BYTES), "image/png")
    res_upload = client.post(
        "/api/v1/organization/logo",
        headers=admin_headers,
        files={"file": file_payload}
    )
    assert res_upload.status_code == 200
    data1 = res_upload.json()
    assert data1["logo_url"] is not None
    assert "cloudinary" in data1["logo_url"] or "res.cloudinary.com" in data1["logo_url"]
    first_public_id = data1.get("logo_public_id")
    assert first_public_id is not None
    assert "foundation/branding/logo" in first_public_id

    # 2. Replace logo with a new file
    file_payload_2 = ("foundation_logo_2.png", io.BytesIO(DUMMY_PNG_BYTES), "image/png")
    res_replace = client.post(
        "/api/v1/organization/logo",
        headers=admin_headers,
        files={"file": file_payload_2}
    )
    assert res_replace.status_code == 200
    data2 = res_replace.json()
    assert data2["logo_url"] is not None
    second_public_id = data2.get("logo_public_id")
    assert second_public_id is not None
    assert "foundation/branding/logo" in second_public_id

    # 3. Remove logo
    res_delete = client.delete("/api/v1/organization/logo", headers=admin_headers)
    assert res_delete.status_code == 200
    data3 = res_delete.json()
    assert data3["logo_url"] is None
    assert data3["logo_public_id"] is None
