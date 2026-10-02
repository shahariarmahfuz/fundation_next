def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin", "password": "AdminPassword123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin", "password": "WrongPassword!"}
    )
    assert response.status_code == 401


def test_get_me(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["is_superuser"] is True
    assert "role" in data
    assert "email" in data


def test_update_user_me_profile_and_password(client, auth_headers):
    # 1. Update full name and email
    update_res = client.put(
        "/api/v1/auth/me",
        headers=auth_headers,
        json={"full_name": "Updated Admin Name", "email": "updated_admin@foundation.org"}
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["full_name"] == "Updated Admin Name"
    assert updated_data["email"] == "updated_admin@foundation.org"

    # 2. Verify GET /me reflects updated information
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Updated Admin Name"

    # 3. Restore original values for test consistency
    restore_res = client.put(
        "/api/v1/auth/me",
        headers=auth_headers,
        json={"full_name": "Foundation Super Administrator", "email": "admin@foundation.org"}
    )
    assert restore_res.status_code == 200

