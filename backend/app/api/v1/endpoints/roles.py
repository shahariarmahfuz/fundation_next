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
    current_user: User = Depends(require_permission(["roles.view", "roles.manage", "roles.permissions"]))
) -> Any:
    return db.query(Permission).order_by(Permission.module, Permission.name, Permission.code).all()


@router.get("", response_model=List[RoleResponse])
def get_all_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(["roles.view", "roles.manage"]))
) -> Any:
    return db.query(Role).order_by(Role.id).all()


@router.get("/{role_id}", response_model=RoleResponse)
def get_role_by_id(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(["roles.view", "roles.manage"]))
) -> Any:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return role


@router.post("", response_model=RoleResponse)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(["roles.create", "roles.manage"]))
) -> Any:
    clean_name = role_in.name.strip()
    if not clean_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name cannot be empty")

    existing = db.query(Role).filter(Role.name.ilike(clean_name)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role with name '{clean_name}' already exists")

    perms = db.query(Permission).filter(Permission.id.in_(role_in.permission_ids)).all() if role_in.permission_ids else []
    role = Role(
        name=clean_name,
        description=role_in.description.strip() if role_in.description else None,
        is_system=False
    )
    role.permissions = perms
    db.add(role)
    db.commit()
    db.refresh(role)

    AuditService.log(
        db, action="CREATE", module="roles", record_id=str(role.id),
        user=current_user, new_values={"name": role.name, "permission_count": len(perms)}
    )
    db.commit()
    return role


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(["roles.update", "roles.manage"]))
) -> Any:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    # Protect Super Admin role from name change or stripping permissions
    if role.name == "Super Admin":
        if role_in.name and role_in.name.strip() != "Super Admin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot rename the Super Admin role")

    if role_in.name is not None:
        clean_name = role_in.name.strip()
        if not clean_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name cannot be empty")
        if clean_name.lower() != role.name.lower():
            existing = db.query(Role).filter(Role.name.ilike(clean_name)).first()
            if existing and existing.id != role.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role with name '{clean_name}' already exists")
        role.name = clean_name
    
    if role_in.description is not None:
        role.description = role_in.description.strip() if role_in.description else None
    
    if role_in.permission_ids is not None:
        if role.name == "Super Admin" and not role_in.permission_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Super Admin role must retain permissions")
        perms = db.query(Permission).filter(Permission.id.in_(role_in.permission_ids)).all()
        role.permissions = perms

    db.commit()
    db.refresh(role)
    AuditService.log(
        db, action="UPDATE", module="roles", record_id=str(role.id),
        user=current_user, new_values={"name": role.name, "permission_count": len(role.permissions)}
    )
    db.commit()
    return role


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(["roles.delete", "roles.manage"]))
) -> Any:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    if role.is_system or role.name.lower() in ("super admin", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"System role '{role.name}' is protected and cannot be deleted."
        )

    if role.users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role '{role.name}' because {role.users_count} user(s) are currently assigned to it. Please reassign those users first."
        )

    role_name = role.name
    db.delete(role)
    AuditService.log(
        db, action="DELETE", module="roles", record_id=str(role_id),
        user=current_user, old_values={"name": role_name}
    )
    db.commit()
    return {"message": f"Role '{role_name}' has been deleted successfully", "id": role_id}
