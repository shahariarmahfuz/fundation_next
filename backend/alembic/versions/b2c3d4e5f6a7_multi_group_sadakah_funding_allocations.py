"""multi_group_sadakah_funding_allocations

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-10-02 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create sadakah_funding_allocations table
    op.create_table(
        'sadakah_funding_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sadakah_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('allocated_amount > 0', name='check_positive_sadakah_allocation_amount'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['sadakah_id'], ['sadakah.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['financial_transactions.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sadakah_funding_allocations_group_id'), 'sadakah_funding_allocations', ['group_id'], unique=False)
    op.create_index(op.f('ix_sadakah_funding_allocations_id'), 'sadakah_funding_allocations', ['id'], unique=False)
    op.create_index(op.f('ix_sadakah_funding_allocations_sadakah_id'), 'sadakah_funding_allocations', ['sadakah_id'], unique=False)
    op.create_index(op.f('ix_sadakah_funding_allocations_transaction_id'), 'sadakah_funding_allocations', ['transaction_id'], unique=False)

    # 2. Allow group_id and transaction_id to be nullable in sadakah for multi-group disbursements
    op.alter_column('sadakah', 'group_id', existing_type=sa.INTEGER(), nullable=True)
    op.alter_column('sadakah', 'transaction_id', existing_type=sa.INTEGER(), nullable=True)

    # 3. Backfill existing sadakah records into sadakah_funding_allocations
    op.execute("""
        INSERT INTO sadakah_funding_allocations (sadakah_id, group_id, allocated_amount, transaction_id, created_at, updated_at)
        SELECT id, group_id, amount, transaction_id, created_at, updated_at
        FROM sadakah
        WHERE group_id IS NOT NULL;
    """)


def downgrade():
    op.drop_index(op.f('ix_sadakah_funding_allocations_transaction_id'), table_name='sadakah_funding_allocations')
    op.drop_index(op.f('ix_sadakah_funding_allocations_sadakah_id'), table_name='sadakah_funding_allocations')
    op.drop_index(op.f('ix_sadakah_funding_allocations_id'), table_name='sadakah_funding_allocations')
    op.drop_index(op.f('ix_sadakah_funding_allocations_group_id'), table_name='sadakah_funding_allocations')
    op.drop_table('sadakah_funding_allocations')
    op.alter_column('sadakah', 'transaction_id', existing_type=sa.INTEGER(), nullable=False)
    op.alter_column('sadakah', 'group_id', existing_type=sa.INTEGER(), nullable=False)
