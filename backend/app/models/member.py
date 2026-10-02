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
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    nid_or_id = Column(String(100), nullable=True)
    joining_date = Column(Date, default=date.today, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False, index=True)  # ACTIVE, INACTIVE, SUSPENDED
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    notes = Column(Text, nullable=True)

    # Relationships
    group = relationship("Group", back_populates="members", lazy="joined")
    contributions = relationship("Contribution", back_populates="member", cascade="all, delete-orphan")
