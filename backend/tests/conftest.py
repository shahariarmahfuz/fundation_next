import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.main import app
from backend.app.core.database import SessionLocal, get_db
from backend.app.models.user import User
from backend.app.models.group import Group
from backend.app.models.member import Member
from backend.app.core.security import create_access_token


@pytest.fixture(scope="session")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def admin_user(db_session: Session):
    admin = db_session.query(User).filter(User.username == "admin").first()
    return admin


@pytest.fixture(scope="session")
def admin_token(admin_user: User):
    return create_access_token(subject=admin_user.id)


@pytest.fixture(scope="session")
def auth_headers(admin_token: str):
    return {"Authorization": f"Bearer {admin_token}"}
