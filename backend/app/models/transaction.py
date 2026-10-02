from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean, Text, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class FinancialTransaction(Base, TimestampMixin):
    __tablename__ = "financial_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_number = Column(String(60), unique=True, nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # CONTRIBUTION, DONATION, EXPENSE, QARD_HASAN_DISBURSEMENT, QARD_HASAN_REPAYMENT, SADAKAH, TRANSFER_IN, TRANSFER_OUT, OPENING_BALANCE, REVERSAL
    transaction_type = Column(String(50), nullable=False, index=True)
    flow_type = Column(String(20), nullable=False, index=True)  # INFLOW, OUTFLOW
    
    amount = Column(Numeric(15, 2), nullable=False)
    transaction_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    balance_after = Column(Numeric(15, 2), nullable=False)
    
    description = Column(String(255), nullable=False)
    reference = Column(String(100), nullable=True)
    payment_method = Column(String(50), default="CASH", nullable=False)  # CASH, BANK_TRANSFER, BKASH, NAGAD, OTHER
    
    related_entity_type = Column(String(50), nullable=True, index=True)  # member, donor, beneficiary, expense, etc.
    related_entity_id = Column(Integer, nullable=True, index=True)
    
    is_reversed = Column(Boolean, default=False, nullable=False, index=True)
    reversed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reversal_reason = Column(Text, nullable=True)
    reversal_transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="SET NULL"), nullable=True)
    
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_positive_amount"),
    )

    # Relationships
    group = relationship("Group", back_populates="transactions", lazy="joined")
    created_by = relationship("User", foreign_keys=[created_by_id])
    reversed_by = relationship("User", foreign_keys=[reversed_by_id])
    reversal_transaction = relationship("FinancialTransaction", remote_side=[id])
