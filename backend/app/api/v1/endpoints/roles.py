from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.role import Role, Permission
from backend.app.models.user import User
from backend.app.schemas.auth import RoleResponse, RoleCreate, RoleUpdate, PermissionResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("/permissions", response_model=List[PermissionResponse])
def get_all_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.manage"))
) -> Any:
    return db.query(Permission).order_by(Permission.module, Permission.code).all()


@router.get("", response_model=List[RoleResponse])
def get_all_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.manage"))
) -> Any:
    return db.query(Role).order_by(Role.id).all()


@router.post("", response_model=RoleResponse)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.manage"))
) -> Any:
    existing = db.query(Role).filter(Role.name == role_in.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name already exists")

    perms = db.query(Permission).filter(Permission.id.in_(role_in.permission_ids)).all() if role_in.permission_ids else []
    role = Role(name=role_in.name, description=role_in.description, is_system=False)
    role.permissions = perms
    db.add(role)
    db.commit()
    db.refresh(role)

    AuditService.log(
        db, action="CREATE", module="roles", record_id=str(role.id),
        user=current_user, new_values={"name": role.name}
    )
    db.commit()
    return role


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.manage"))
) -> Any:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    if role_in.name and role_in.name != role.name:
        existing = db.query(Role).filter(Role.name == role_in.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name already exists")
        role.name = role_in.name
    
    if role_in.description is not None:
        role.description = role_in.description
    
    if role_in.permission_ids is not None:
        perms = db.query(Permission).filter(Permission.id.in_(role_in.permission_ids)).all()
        role.permissions = perms

    db.commit()
    db.refresh(role)
    AuditService.log(
        db, action="UPDATE", module="roles", record_id=str(role.id),
        user=current_user, new_values={"name": role.name}
    )
    db.commit()
    return role
