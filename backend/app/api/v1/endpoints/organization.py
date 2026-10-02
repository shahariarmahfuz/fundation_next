from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.organization import Organization
from backend.app.models.user import User
from backend.app.schemas.organization import OrganizationResponse, OrganizationUpdate
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=OrganizationResponse)
def get_organization_settings(
    db: Session = Depends(get_db)
) -> Any:
    cache_key = "org:settings"
    cached = cache.get(cache_key)
    if cached:
        return cached

    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Humanity First Foundation")
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
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Humanity First Foundation")
        db.add(org)
        db.flush()

    if org_in.name is not None:
        org.name = org_in.name
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
        user=current_user, new_values={"name": org.name, "phone": org.phone}
    )
    db.commit()
    return org
