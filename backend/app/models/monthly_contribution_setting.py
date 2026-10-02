from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, Integer, Numeric, Date, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class MonthlyContributionSetting(Base, TimestampMixin):
    __tablename__ = "monthly_contribution_settings"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(15, 2), nullable=False, default=Decimal("100.00"))
    effective_from = Column(Date, unique=True, nullable=False, index=True)
    notes = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
