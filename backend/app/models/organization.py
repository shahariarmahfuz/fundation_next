from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), default="Humanity First Foundation", nullable=False)
    tagline = Column(String(255), default="Empowering Communities Through Islamic Finance & Charity", nullable=True)
    logo_url = Column(String(500), nullable=True)
    logo_public_id = Column(String(255), nullable=True)
    logo_resource_type = Column(String(50), default="image", nullable=True)
    logo_format = Column(String(20), nullable=True)
    logo_updated_at = Column(DateTime(timezone=True), nullable=True)
    description = Column(Text, nullable=True)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    social_links = Column(JSON, default=dict, nullable=False)
    currency_symbol = Column(String(10), default="৳", nullable=False)
    currency_code = Column(String(10), default="BDT", nullable=False)
    
    updated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = relationship("User")


class PublicPage(Base, TimestampMixin):
    __tablename__ = "public_pages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, nullable=False, index=True)  # home, about, goals, mission, activities, contact
    title = Column(String(200), nullable=False)
    subtitle = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)  # Rich content / JSON / HTML / Markdown
    banner_image_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(300), nullable=True)
    
    updated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = relationship("User")
