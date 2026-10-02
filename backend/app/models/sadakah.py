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
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    disbursement_date = Column(Date, default=date.today, nullable=False, index=True)
    payment_method = Column(String(50), default="CASH", nullable=False)
    description = Column(String(255), nullable=False)
    reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_positive_sadakah_amount"),
    )

    # Relationships
    group = relationship("Group", back_populates="sadakah_grants", lazy="joined")
    beneficiary = relationship("Beneficiary", back_populates="sadakah_grants", lazy="joined")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
