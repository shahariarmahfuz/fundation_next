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
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    assigned_group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)

    # Optional profile fields (not required on public application)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True, index=True)
    address = Column(String(255), nullable=True)
    nid_or_id = Column(String(100), nullable=True)
    proposed_contribution = Column(Numeric(15, 2), nullable=True)
    reason_for_joining = Column(Text, nullable=True)

    status = Column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED
    review_notes = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_member_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    group = relationship("Group", foreign_keys=[group_id])
    assigned_group = relationship("Group", foreign_keys=[assigned_group_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    created_member = relationship("Member", foreign_keys=[created_member_id])

    @property
    def full_name(self) -> str:
        return self.applicant_name

    @full_name.setter
    def full_name(self, value: str):
        self.applicant_name = value

    @property
    def application_id(self) -> int:
        return self.id

