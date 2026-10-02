"""multi group qard hasan funding and repayment allocations

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-10-02 16:07:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Allow nullable group_id and transaction_id for multi-group loans
    op.alter_column('qard_hasan', 'group_id', existing_type=sa.Integer(), nullable=True)
    op.alter_column('qard_hasan', 'disbursement_transaction_id', existing_type=sa.Integer(), nullable=True)
    op.alter_column('qard_repayments', 'group_id', existing_type=sa.Integer(), nullable=True)
    op.alter_column('qard_repayments', 'transaction_id', existing_type=sa.Integer(), nullable=True)

    # 2. Create qard_hasan_funding_allocations table
    op.create_table(
        'qard_hasan_funding_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('qard_hasan_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('repaid_amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('outstanding_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['qard_hasan_id'], ['qard_hasan.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['financial_transactions.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('allocated_amount > 0', name='check_positive_allocation_amount'),
        sa.CheckConstraint('repaid_amount >= 0', name='check_non_negative_alloc_repaid'),
        sa.CheckConstraint('outstanding_amount >= 0', name='check_non_negative_alloc_outstanding')
    )
    op.create_index(op.f('ix_qard_hasan_funding_allocations_id'), 'qard_hasan_funding_allocations', ['id'], unique=False)
    op.create_index(op.f('ix_qard_hasan_funding_allocations_qard_hasan_id'), 'qard_hasan_funding_allocations', ['qard_hasan_id'], unique=False)
    op.create_index(op.f('ix_qard_hasan_funding_allocations_group_id'), 'qard_hasan_funding_allocations', ['group_id'], unique=False)
    op.create_index(op.f('ix_qard_hasan_funding_allocations_transaction_id'), 'qard_hasan_funding_allocations', ['transaction_id'], unique=False)

    # 3. Create qard_hasan_repayment_allocations table
    op.create_table(
        'qard_hasan_repayment_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('repayment_id', sa.Integer(), nullable=False),
        sa.Column('funding_allocation_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['funding_allocation_id'], ['qard_hasan_funding_allocations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['repayment_id'], ['qard_repayments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['financial_transactions.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('allocated_amount > 0', name='check_positive_repayment_alloc_amount')
    )
    op.create_index(op.f('ix_qard_hasan_repayment_allocations_id'), 'qard_hasan_repayment_allocations', ['id'], unique=False)
    op.create_index(op.f('ix_qard_hasan_repayment_allocations_repayment_id'), 'qard_hasan_repayment_allocations', ['repayment_id'], unique=False)
    op.create_index(op.f('ix_qard_hasan_repayment_allocations_funding_allocation_id'), 'qard_hasan_repayment_allocations', ['funding_allocation_id'], unique=False)
    op.create_index(op.f('ix_qard_hasan_repayment_allocations_group_id'), 'qard_hasan_repayment_allocations', ['group_id'], unique=False)
    op.create_index(op.f('ix_qard_hasan_repayment_allocations_transaction_id'), 'qard_hasan_repayment_allocations', ['transaction_id'], unique=False)

    # 4. Backfill existing loans into qard_hasan_funding_allocations
    op.execute("""
        INSERT INTO qard_hasan_funding_allocations (
            qard_hasan_id, group_id, allocated_amount, repaid_amount, outstanding_amount, transaction_id, created_at, updated_at
        )
        SELECT id, group_id, principal_amount, total_repaid, outstanding_amount, disbursement_transaction_id, created_at, updated_at
        FROM qard_hasan
        WHERE group_id IS NOT NULL;
    """)

    # 5. Backfill existing repayments into qard_hasan_repayment_allocations
    op.execute("""
        INSERT INTO qard_hasan_repayment_allocations (
            repayment_id, funding_allocation_id, group_id, allocated_amount, transaction_id, created_at, updated_at
        )
        SELECT r.id, fa.id, r.group_id, r.amount, r.transaction_id, r.created_at, r.updated_at
        FROM qard_repayments r
        JOIN qard_hasan_funding_allocations fa ON fa.qard_hasan_id = r.qard_hasan_id AND fa.group_id = r.group_id;
    """)


def downgrade() -> None:
    op.drop_table('qard_hasan_repayment_allocations')
    op.drop_table('qard_hasan_funding_allocations')
    op.alter_column('qard_repayments', 'transaction_id', existing_type=sa.Integer(), nullable=False)
    op.alter_column('qard_repayments', 'group_id', existing_type=sa.Integer(), nullable=False)
    op.alter_column('qard_hasan', 'disbursement_transaction_id', existing_type=sa.Integer(), nullable=False)
    op.alter_column('qard_hasan', 'group_id', existing_type=sa.Integer(), nullable=False)
