from datetime import date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class Donor(Base, TimestampMixin):
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, index=True)
    donor_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)
    notes = Column(Text, nullable=True)

    donations = relationship("Donation", back_populates="donor")


class Donation(Base, TimestampMixin):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    donation_number = Column(String(60), unique=True, nullable=False, index=True)
    source_type = Column(String(20), default="DONOR", nullable=False, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id", ondelete="SET NULL"), nullable=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    donation_date = Column(Date, default=date.today, nullable=False, index=True)
    payment_method = Column(String(50), default="CASH", nullable=False)
    reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_positive_donation_amount"),
    )

    # Relationships
    donor = relationship("Donor", back_populates="donations", lazy="joined")
    member = relationship("Member", foreign_keys=[member_id], lazy="joined")
    group = relationship("Group", back_populates="donations", lazy="joined")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
    created_by = relationship("User", foreign_keys=[created_by_id])

    @property
    def status(self) -> str:
        if self.transaction and getattr(self.transaction, "is_reversed", False):
            return "REVERSED"
        return "COMPLETED"

