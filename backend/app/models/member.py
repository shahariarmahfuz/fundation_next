from datetime import date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class Member(Base, TimestampMixin):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    member_number = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(String(20), default="ACTIVE", nullable=False, index=True)  # ACTIVE, INACTIVE, SUSPENDED

    # Optional profile fields
    joining_date = Column(Date, default=date.today, nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True, index=True)
    alternative_phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    present_address = Column(String(255), nullable=True)
    permanent_address = Column(String(255), nullable=True)
    nid_or_id = Column(String(100), nullable=True)
    father_name = Column(String(150), nullable=True)
    mother_name = Column(String(150), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    occupation = Column(String(150), nullable=True)
    education = Column(String(150), nullable=True)
    blood_group = Column(String(20), nullable=True)
    marital_status = Column(String(30), nullable=True)
    
    # Emergency contact (optional)
    emergency_contact_name = Column(String(150), nullable=True)
    emergency_contact_relationship = Column(String(50), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)

    # Reference (optional)
    reference_name = Column(String(150), nullable=True)
    reference_phone = Column(String(50), nullable=True)
    reference_relationship = Column(String(50), nullable=True)

    # Commitment & Documents (optional)
    commitment = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    signature_url = Column(String(500), nullable=True)
    document_type = Column(String(50), nullable=True)
    nid_front_url = Column(String(500), nullable=True)
    nid_back_url = Column(String(500), nullable=True)

    # Remarks & Reason
    reason_for_joining = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    group = relationship("Group", back_populates="members", lazy="joined")
    contributions = relationship("Contribution", back_populates="member", cascade="all, delete-orphan")
