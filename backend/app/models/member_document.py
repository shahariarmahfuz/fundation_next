from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class MemberDocument(Base, TimestampMixin):
    __tablename__ = "member_documents"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Document categorization
    document_type = Column(String(50), nullable=True)  # e.g., "National ID", "Birth Certificate", "Passport", "Other"
    document_category = Column(String(50), nullable=False, index=True)  # "PHOTO", "SIGNATURE", "NID_FRONT", "NID_BACK", "BIRTH_CERTIFICATE", "OTHER"
    
    # Cloudinary asset details
    cloudinary_public_id = Column(String(255), nullable=False, index=True)
    secure_url = Column(String(500), nullable=False)
    resource_type = Column(String(50), default="image", nullable=False)
    format = Column(String(20), nullable=True)
    file_size = Column(Integer, nullable=True)  # size in bytes
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    original_filename = Column(String(255), nullable=True)
    mime_type = Column(String(100), nullable=True)
    
    # Audit trail
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    member = relationship("Member", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])
