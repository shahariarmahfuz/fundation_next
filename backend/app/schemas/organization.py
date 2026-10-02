from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class OrganizationBase(BaseModel):
    name: str = "Humanity First Foundation"
    tagline: Optional[str] = "Empowering Communities Through Islamic Finance & Charity"
    logo_url: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    social_links: Dict[str, Any] = {}
    currency_symbol: str = "৳"
    currency_code: str = "BDT"


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    social_links: Optional[Dict[str, Any]] = None
    currency_symbol: Optional[str] = None
    currency_code: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    updated_at: datetime


class PublicPageBase(BaseModel):
    slug: str
    title: str
    subtitle: Optional[str] = None
    content: str
    banner_image_url: Optional[str] = None
    is_published: bool = True
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class PublicPageUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    banner_image_url: Optional[str] = None
    is_published: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class PublicPageResponse(PublicPageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    updated_at: datetime
