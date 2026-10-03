import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.role import Role, Permission
from backend.app.models.user import User
from backend.app.core.security import get_password_hash, create_access_token


def test_get_all_permissions(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/roles/permissions", headers=auth_headers)
    assert resp.status_code == 200
    perms = resp.json()
    assert len(perms) >= 90
    codes = {p["code"] for p in perms}
    assert "members.view" in codes
    assert "members.create" in codes
    assert "roles.create" in codes
    assert "expenses.approve" in codes


def test_get_all_roles(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/roles", headers=auth_headers)
    assert resp.status_code == 200
    roles = resp.json()
    assert len(roles) >= 4
    role_names = [r["name"] for r in roles]
    assert "Super Admin" in role_names
    assert "Admin" in role_names
    
    super_admin = next(r for r in roles if r["name"] == "Super Admin")
    assert super_admin["is_system"] is True
    assert "users_count" in super_admin
    assert super_admin["users_count"] >= 1


def test_create_and_manage_custom_role_lifecycle(client: TestClient, auth_headers: dict, db_session: Session):
    # 1. Fetch available permissions
    p_resp = client.get("/api/v1/roles/permissions", headers=auth_headers)
    assert p_resp.status_code == 200
    all_perms = p_resp.json()
    member_view_perm = next(p for p in all_perms if p["code"] == "members.view")
    member_create_perm = next(p for p in all_perms if p["code"] == "members.create")

    # Cleanup if previously exists
    existing = db_session.query(Role).filter(Role.name == "Test Field Officer").first()
    if existing:
        for u in existing.users:
            u.role_id = None
        db_session.delete(existing)
        db_session.commit()

    # 2. Create custom role
    create_payload = {
        "name": "Test Field Officer",
        "description": "Handles field operations and basic member enrollment",
        "permission_ids": [member_view_perm["id"], member_create_perm["id"]],
    }
    resp = client.post("/api/v1/roles", json=create_payload, headers=auth_headers)
    assert resp.status_code == 200
    created_role = resp.json()
    role_id = created_role["id"]
    assert created_role["name"] == "Test Field Officer"
    assert created_role["is_system"] is False
    assert len(created_role["permissions"]) == 2

    # 3. Duplicate name prevention
    dup_resp = client.post("/api/v1/roles", json=create_payload, headers=auth_headers)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]

    # Case-insensitive duplicate name check
    dup_case_resp = client.post(
        "/api/v1/roles",
        json={"name": "test field officer", "description": "Duplicate test"},
        headers=auth_headers
    )
    assert dup_case_resp.status_code == 400

    # 4. Get single role by ID
    get_resp = client.get(f"/api/v1/roles/{role_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == role_id
    assert get_resp.json()["name"] == "Test Field Officer"

    # 5. Update custom role
    update_payload = {
        "name": "Test Field Officer Senior",
        "description": "Updated senior field responsibilities",
        "permission_ids": [member_view_perm["id"]],
    }
    update_resp = client.put(f"/api/v1/roles/{role_id}", json=update_payload, headers=auth_headers)
    assert update_resp.status_code == 200
    updated_role = update_resp.json()
    assert updated_role["name"] == "Test Field Officer Senior"
    assert updated_role["description"] == "Updated senior field responsibilities"
    assert len(updated_role["permissions"]) == 1

    # 6. Assign role to user & verify delete protection when role in use
    test_user = db_session.query(User).filter(User.username == "test_field_user").first()
    if not test_user:
        test_user = User(
            username="test_field_user",
            email="field_test@foundation.org",
            full_name="Test Field User",
            hashed_password=get_password_hash("Secret123!"),
            role_id=role_id,
            is_active=True,
            is_superuser=False
        )
        db_session.add(test_user)
        db_session.commit()
    else:
        test_user.role_id = role_id
        db_session.commit()

    # Attempt delete while assigned -> should fail 400
    del_blocked_resp = client.delete(f"/api/v1/roles/{role_id}", headers=auth_headers)
    assert del_blocked_resp.status_code == 400
    assert "assigned to it" in del_blocked_resp.json()["detail"]

    # 7. Verify RBAC permission enforcement for the assigned user
    field_user_token = create_access_token(subject=test_user.id)
    field_user_headers = {"Authorization": f"Bearer {field_user_token}"}

    # Field user does NOT have "roles.create" permission -> forbidden
    forbidden_resp = client.post(
        "/api/v1/roles",
        json={"name": "Hacker Role"},
        headers=field_user_headers
    )
    assert forbidden_resp.status_code == 403

    # 8. Unassign user and delete role
    test_user.role_id = None
    db_session.commit()

    del_resp = client.delete(f"/api/v1/roles/{role_id}", headers=auth_headers)
    assert del_resp.status_code == 200
    assert "deleted successfully" in del_resp.json()["message"]

    # Verify role is gone
    get_404_resp = client.get(f"/api/v1/roles/{role_id}", headers=auth_headers)
    assert get_404_resp.status_code == 404

    # Cleanup user
    db_session.delete(test_user)
    db_session.commit()


def test_system_role_protection(client: TestClient, auth_headers: dict, db_session: Session):
    super_admin_role = db_session.query(Role).filter(Role.name == "Super Admin").first()
    assert super_admin_role is not None

    # Cannot delete Super Admin
    del_resp = client.delete(f"/api/v1/roles/{super_admin_role.id}", headers=auth_headers)
    assert del_resp.status_code == 400
    assert "cannot be deleted" in del_resp.json()["detail"]

    # Cannot rename Super Admin
    rename_resp = client.put(
        f"/api/v1/roles/{super_admin_role.id}",
        json={"name": "Regular User"},
        headers=auth_headers
    )
    assert rename_resp.status_code == 400
    assert "Cannot rename the Super Admin role" in rename_resp.json()["detail"]
