from datetime import date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Text, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class ExpenseCategory(Base, TimestampMixin):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    expenses = relationship("Expense", back_populates="category")


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_number = Column(String(60), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    expense_date = Column(Date, default=date.today, nullable=False, index=True)
    payment_method = Column(String(50), default="CASH", nullable=False)
    reference = Column(String(100), nullable=True)
    payee = Column(String(150), nullable=True)
    description = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    
    transaction_id = Column(Integer, ForeignKey("financial_transactions.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_positive_expense_amount"),
    )

    # Relationships
    category = relationship("ExpenseCategory", back_populates="expenses", lazy="joined")
    group = relationship("Group", back_populates="expenses", lazy="joined")
    transaction = relationship("FinancialTransaction", foreign_keys=[transaction_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
