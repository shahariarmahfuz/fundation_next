"""create_code_sequences

Revision ID: c1f839a04a11
Revises: 936928033200
Create Date: 2026-10-02 11:36:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1f839a04a11'
down_revision: Union[str, Sequence[str], None] = '936928033200'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create dedicated PostgreSQL sequences for Members, Groups, and Beneficiaries."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("CREATE SEQUENCE IF NOT EXISTS member_code_seq START WITH 1")
        op.execute("CREATE SEQUENCE IF NOT EXISTS group_code_seq START WITH 1")
        op.execute("CREATE SEQUENCE IF NOT EXISTS beneficiary_code_seq START WITH 1")


def downgrade() -> None:
    """Drop dedicated sequences."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP SEQUENCE IF EXISTS member_code_seq")
        op.execute("DROP SEQUENCE IF EXISTS group_code_seq")
        op.execute("DROP SEQUENCE IF EXISTS beneficiary_code_seq")
