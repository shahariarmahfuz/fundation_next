from datetime import date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class Sadakah(Base, TimestampMixin):
    __tablename__ = "sadakah"

    id = Column(Integer, primary_key=True, index=True)
    sadakah_number = Column(String(60), unique=True, nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    disbursement_date = Column(Date, default=date.today, nullable=False, index=True)
    payment_method = Column(String(50), default="CASH", nullable=False)
    description = Column(String(255), nullable=False)
    reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_positive_sadakah_amount"),
    )

    # Relationships
    group = relationship("Group", back_populates="sadakah_grants")
    beneficiary = relationship("Beneficiary", back_populates="sadakah_grants")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    funding_allocations = relationship(
        "SadakahFundingAllocation",
        back_populates="sadakah",
        cascade="all, delete-orphan",
        order_by="SadakahFundingAllocation.id.asc()"
    )


class SadakahFundingAllocation(Base, TimestampMixin):
    __tablename__ = "sadakah_funding_allocations"

    id = Column(Integer, primary_key=True, index=True)
    sadakah_id = Column(Integer, ForeignKey("sadakah.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    allocated_amount = Column(Numeric(15, 2), nullable=False)
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=True, index=True)

    __table_args__ = (
        CheckConstraint("allocated_amount > 0", name="check_positive_sadakah_allocation_amount"),
    )

    # Relationships
    sadakah = relationship("Sadakah", back_populates="funding_allocations")
    group = relationship("Group")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
