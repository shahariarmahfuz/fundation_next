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
