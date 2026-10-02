from datetime import date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class QardHasan(Base, TimestampMixin):
    __tablename__ = "qard_hasan"

    id = Column(Integer, primary_key=True, index=True)
    qard_number = Column(String(60), unique=True, nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    principal_amount = Column(Numeric(15, 2), nullable=False)
    monthly_repayment_amount = Column(Numeric(15, 2), nullable=False)
    total_repaid = Column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    outstanding_amount = Column(Numeric(15, 2), nullable=False)
    
    disbursed_date = Column(Date, default=date.today, nullable=False, index=True)
    interest_rate = Column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)  # Strictly 0
    status = Column(String(25), default="ACTIVE", nullable=False, index=True)  # ACTIVE, PARTIALLY_REPAID, FULLY_REPAID, CANCELLED
    
    repayment_schedule_notes = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    disbursement_transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        CheckConstraint("principal_amount > 0", name="check_positive_principal"),
        CheckConstraint("interest_rate = 0", name="check_zero_interest_rate"),
        CheckConstraint("outstanding_amount >= 0", name="check_non_negative_outstanding"),
        CheckConstraint("total_repaid >= 0", name="check_non_negative_repaid"),
    )

    # Relationships
    group = relationship("Group", back_populates="qard_hasan_loans", lazy="joined")
    beneficiary = relationship("Beneficiary", back_populates="qard_hasan_loans", lazy="joined")
    disbursement_transaction = relationship("FinancialTransaction", foreign_keys=[disbursement_transaction_id])
    funding_allocations = relationship("QardHasanFundingAllocation", back_populates="qard_hasan", cascade="all, delete-orphan", order_by="QardHasanFundingAllocation.id.asc()")
    repayments = relationship("QardRepayment", back_populates="qard_hasan", cascade="all, delete-orphan", order_by="QardRepayment.repayment_date.asc()")
    created_by = relationship("User", foreign_keys=[created_by_id])


class QardHasanFundingAllocation(Base, TimestampMixin):
    __tablename__ = "qard_hasan_funding_allocations"

    id = Column(Integer, primary_key=True, index=True)
    qard_hasan_id = Column(Integer, ForeignKey("qard_hasan.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    allocated_amount = Column(Numeric(15, 2), nullable=False)
    repaid_amount = Column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    outstanding_amount = Column(Numeric(15, 2), nullable=False)
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=True, index=True)

    __table_args__ = (
        CheckConstraint("allocated_amount > 0", name="check_positive_allocation_amount"),
        CheckConstraint("repaid_amount >= 0", name="check_non_negative_alloc_repaid"),
        CheckConstraint("outstanding_amount >= 0", name="check_non_negative_alloc_outstanding"),
    )

    qard_hasan = relationship("QardHasan", back_populates="funding_allocations")
    group = relationship("Group", lazy="joined")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
    repayment_allocations = relationship("QardHasanRepaymentAllocation", back_populates="funding_allocation", cascade="all, delete-orphan", order_by="QardHasanRepaymentAllocation.id.asc()")


class QardRepayment(Base, TimestampMixin):
    __tablename__ = "qard_repayments"

    id = Column(Integer, primary_key=True, index=True)
    repayment_number = Column(String(60), unique=True, nullable=False, index=True)
    qard_hasan_id = Column(Integer, ForeignKey("qard_hasan.id", ondelete="RESTRICT"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    amount = Column(Numeric(15, 2), nullable=False)
    repayment_date = Column(Date, default=date.today, nullable=False, index=True)
    payment_method = Column(String(50), default="CASH", nullable=False)
    reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_positive_repayment_amount"),
    )

    # Relationships
    qard_hasan = relationship("QardHasan", back_populates="repayments")
    group = relationship("Group", lazy="joined")
    beneficiary = relationship("Beneficiary", back_populates="qard_repayments", lazy="joined")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
    allocations = relationship("QardHasanRepaymentAllocation", back_populates="repayment", cascade="all, delete-orphan", order_by="QardHasanRepaymentAllocation.id.asc()")
    created_by = relationship("User", foreign_keys=[created_by_id])


class QardHasanRepaymentAllocation(Base, TimestampMixin):
    __tablename__ = "qard_hasan_repayment_allocations"

    id = Column(Integer, primary_key=True, index=True)
    repayment_id = Column(Integer, ForeignKey("qard_repayments.id", ondelete="CASCADE"), nullable=False, index=True)
    funding_allocation_id = Column(Integer, ForeignKey("qard_hasan_funding_allocations.id", ondelete="RESTRICT"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    allocated_amount = Column(Numeric(15, 2), nullable=False)
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=True, index=True)

    __table_args__ = (
        CheckConstraint("allocated_amount > 0", name="check_positive_repayment_alloc_amount"),
    )

    repayment = relationship("QardRepayment", back_populates="allocations")
    funding_allocation = relationship("QardHasanFundingAllocation", back_populates="repayment_allocations")
    group = relationship("Group", lazy="joined")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
