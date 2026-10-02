from datetime import date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class Contribution(Base, TimestampMixin):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    contribution_number = Column(String(60), unique=True, nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    contribution_month = Column(String(7), nullable=False, index=True)  # YYYY-MM e.g. 2026-01
    amount = Column(Numeric(15, 2), nullable=False)
    
    # PAID, CURRENT_PENDING, DUE, FUTURE
    status = Column(String(25), default="DUE", nullable=False, index=True)
    payment_date = Column(Date, nullable=True)
    payment_method = Column(String(50), default="CASH", nullable=True)  # CASH, BANK_TRANSFER, BKASH, etc.
    reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        UniqueConstraint("member_id", "contribution_month", name="uq_member_month_contribution"),
    )

    # Relationships
    member = relationship("Member", back_populates="contributions", lazy="joined")
    group = relationship("Group", back_populates="contributions", lazy="joined")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
