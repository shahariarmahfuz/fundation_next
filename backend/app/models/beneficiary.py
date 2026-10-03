from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class Beneficiary(Base, TimestampMixin):
    __tablename__ = "beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    beneficiary_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    nid_or_id = Column(String(100), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False, index=True)
    notes = Column(Text, nullable=True)

    # Optional Personal Information
    father_or_husband_name = Column(String(150), nullable=True)
    present_address = Column(Text, nullable=True)
    permanent_address = Column(Text, nullable=True)

    # Optional Emergency Contact
    emergency_contact_name = Column(String(150), nullable=True)
    emergency_contact_relation = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)

    # Optional Documents
    photo_url = Column(Text, nullable=True)
    signature_url = Column(Text, nullable=True)
    id_document_type = Column(String(50), nullable=True)
    nid_front_url = Column(Text, nullable=True)
    nid_back_url = Column(Text, nullable=True)

    # Relationships
    qard_hasan_loans = relationship("QardHasan", back_populates="beneficiary")
    sadakah_grants = relationship("Sadakah", back_populates="beneficiary")
    qard_repayments = relationship("QardRepayment", back_populates="beneficiary")
