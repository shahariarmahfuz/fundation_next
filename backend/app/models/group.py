from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class Group(Base, TimestampMixin):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False, index=True)  # ACTIVE, INACTIVE
    opening_balance = Column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)

    # Relationships
    members = relationship("Member", back_populates="group")
    transactions = relationship("FinancialTransaction", back_populates="group", order_by="FinancialTransaction.id.desc()")
    contributions = relationship("Contribution", back_populates="group")
    expenses = relationship("Expense", back_populates="group")
    donations = relationship("Donation", back_populates="group")
    qard_hasan_loans = relationship("QardHasan", back_populates="group")
    sadakah_grants = relationship("Sadakah", back_populates="group")
