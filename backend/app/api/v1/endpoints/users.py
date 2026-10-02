from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.role import Role
from backend.app.schemas.auth import UserResponse, UserCreate, UserUpdate
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.manage"))
) -> Any:
    return db.query(User).order_by(User.id).all()


@router.post("", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.manage"))
) -> Any:
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already exists")

    if user_in.role_id:
        role = db.query(Role).filter(Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role does not exist")

    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role_id=user_in.role_id,
        is_active=user_in.is_active,
        is_superuser=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    AuditService.log(
        db, action="CREATE", module="users", record_id=str(user.id),
        user=current_user, new_values={"username": user.username, "email": user.email}
    )
    db.commit()
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.manage"))
) -> Any:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_data = {"full_name": user.full_name, "email": user.email, "role_id": user.role_id, "is_active": user.is_active}

    if user_in.email and user_in.email != user.email:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        user.email = user_in.email

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role_id is not None:
        user.role_id = user_in.role_id
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)

    AuditService.log(
        db, action="UPDATE", module="users", record_id=str(user.id),
        user=current_user, old_values=old_data,
        new_values={"full_name": user.full_name, "email": user.email, "role_id": user.role_id, "is_active": user.is_active}
    )
    db.commit()
    return user
