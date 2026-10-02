from datetime import datetime, timezone
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.organization import PublicPage, Organization
from backend.app.models.user import User
from backend.app.schemas.organization import PublicPageResponse, PublicPageUpdate, OrganizationResponse
from backend.app.api.deps import require_permission

router = APIRouter()


@router.get("/pages", response_model=List[PublicPageResponse])
def get_all_public_pages(
    db: Session = Depends(get_db)
) -> Any:
    return db.query(PublicPage).filter(PublicPage.is_published.is_(True)).all()


@router.get("/pages/{slug}", response_model=PublicPageResponse)
def get_public_page_by_slug(
    slug: str,
    db: Session = Depends(get_db)
) -> Any:
    cache_key = f"cms:page:{slug}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    page = db.query(PublicPage).filter(PublicPage.slug == slug).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    resp = PublicPageResponse.model_validate(page)
    cache.set(cache_key, resp.model_dump(), expire_seconds=1800)
    return resp


@router.put("/pages/{slug}", response_model=PublicPageResponse)
def update_public_page(
    slug: str,
    page_in: PublicPageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings.manage"))
) -> Any:
    page = db.query(PublicPage).filter(PublicPage.slug == slug).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    if page_in.title is not None:
        page.title = page_in.title
    if page_in.subtitle is not None:
        page.subtitle = page_in.subtitle
    if page_in.content is not None:
        page.content = page_in.content
    if page_in.banner_image_url is not None:
        page.banner_image_url = page_in.banner_image_url
    if page_in.is_published is not None:
        page.is_published = page_in.is_published
    if page_in.meta_title is not None:
        page.meta_title = page_in.meta_title
    if page_in.meta_description is not None:
        page.meta_description = page_in.meta_description

    page.updated_by_id = current_user.id
    page.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(page)
    cache.delete(f"cms:page:{slug}")
    return page
