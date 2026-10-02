from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.organization import Organization
from backend.app.models.user import User
from backend.app.schemas.organization import OrganizationResponse, OrganizationUpdate
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService
from backend.app.services.cloudinary_service import CloudinaryService

router = APIRouter()


@router.get("", response_model=OrganizationResponse)
def get_organization_settings(
    db: Session = Depends(get_db)
) -> Any:
    """
    Publicly accessible endpoint to retrieve foundation organization branding and profile.
    """
    cache_key = "org:settings"
    cached = cache.get(cache_key)
    if cached:
        return cached

    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Al-Birr Foundation")
        db.add(org)
        db.commit()
        db.refresh(org)

    resp = OrganizationResponse.model_validate(org)
    cache.set(cache_key, resp.model_dump(), expire_seconds=3600)
    return resp


@router.put("", response_model=OrganizationResponse)
def update_organization_settings(
    org_in: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings.manage"))
) -> Any:
    """
    Updates foundation details and organization settings.
    Protected by 'settings.manage' permission.
    """
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Al-Birr Foundation")
        db.add(org)
        db.flush()

    old_name = org.name

    if org_in.name is not None:
        org.name = org_in.name.strip()
    if org_in.tagline is not None:
        org.tagline = org_in.tagline
    if org_in.logo_url is not None:
        org.logo_url = org_in.logo_url
    if org_in.description is not None:
        org.description = org_in.description
    if org_in.address is not None:
        org.address = org_in.address
    if org_in.phone is not None:
        org.phone = org_in.phone
    if org_in.email is not None:
        org.email = org_in.email
    if org_in.website is not None:
        org.website = org_in.website
    if org_in.social_links is not None:
        org.social_links = org_in.social_links
    if org_in.currency_symbol is not None:
        org.currency_symbol = org_in.currency_symbol
    if org_in.currency_code is not None:
        org.currency_code = org_in.currency_code

    org.updated_by_id = current_user.id
    org.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(org)
    cache.delete("org:settings")

    AuditService.log(
        db, action="UPDATE", module="organization", record_id=str(org.id),
        user=current_user,
        details=f"Foundation settings updated. Name: '{old_name}' -> '{org.name}'",
        old_values={"name": old_name},
        new_values={"name": org.name, "phone": org.phone, "email": org.email}
    )
    db.commit()
    return org


@router.post("/logo", response_model=OrganizationResponse)
def upload_organization_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings.manage"))
) -> Any:
    """
    Uploads or safely replaces the official Foundation logo in Cloudinary.
    Folder: foundation/branding/logo
    Protected by 'settings.manage' permission.
    """
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Al-Birr Foundation")
        db.add(org)
        db.flush()

    file_bytes, clean_filename, mime_type = CloudinaryService.validate_file(file, category="LOGO")

    old_public_id = org.logo_public_id
    folder = "foundation/branding/logo"

    # Safely replace: upload new asset first, then delete previous asset
    upload_res = CloudinaryService.replace(
        old_public_id=old_public_id,
        file_bytes=file_bytes,
        filename=clean_filename,
        folder=folder,
        resource_type="image",
        old_resource_type="image"
    )

    org.logo_url = upload_res["secure_url"]
    org.logo_public_id = upload_res["public_id"]
    org.logo_resource_type = upload_res.get("resource_type", "image")
    org.logo_format = upload_res.get("format")
    org.logo_updated_at = datetime.now(timezone.utc)
    org.updated_by_id = current_user.id
    org.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(org)
    cache.delete("org:settings")

    AuditService.log(
        db, action="UPDATE", module="organization", record_id=str(org.id),
        user=current_user,
        details=f"Foundation logo updated to Cloudinary public_id: {org.logo_public_id}"
    )
    db.commit()
    return org


@router.delete("/logo", response_model=OrganizationResponse)
def remove_organization_logo(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings.manage"))
) -> Any:
    """
    Removes the official Foundation logo and deletes the asset from Cloudinary.
    Protected by 'settings.manage' permission.
    """
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization settings not found")

    old_public_id = org.logo_public_id
    if old_public_id:
        try:
            CloudinaryService.delete(old_public_id, resource_type="image")
        except Exception:
            pass

    org.logo_url = None
    org.logo_public_id = None
    org.logo_format = None
    org.logo_updated_at = datetime.now(timezone.utc)
    org.updated_by_id = current_user.id
    org.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(org)
    cache.delete("org:settings")

    AuditService.log(
        db, action="UPDATE", module="organization", record_id=str(org.id),
        user=current_user,
        details="Foundation logo removed."
    )
    db.commit()
    return org
