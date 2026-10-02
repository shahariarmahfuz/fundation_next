from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class MemberApplication(Base, TimestampMixin):
    __tablename__ = "member_applications"

    id = Column(Integer, primary_key=True, index=True)
    applicant_name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    nid_or_id = Column(String(100), nullable=True)
    proposed_contribution = Column(Numeric(15, 2), default=Decimal("500.00"), nullable=False)
    reason_for_joining = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED
    review_notes = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    assigned_group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    created_member_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    assigned_group = relationship("Group", foreign_keys=[assigned_group_id])
    created_member = relationship("Member", foreign_keys=[created_member_id])
