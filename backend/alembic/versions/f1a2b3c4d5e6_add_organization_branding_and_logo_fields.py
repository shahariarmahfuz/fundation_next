"""add organization branding and logo fields

Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2026-10-02 12:43:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add branding & Cloudinary logo fields to organizations table
    op.add_column('organizations', sa.Column('logo_public_id', sa.String(length=255), nullable=True))
    op.add_column('organizations', sa.Column('logo_resource_type', sa.String(length=50), server_default='image', nullable=True))
    op.add_column('organizations', sa.Column('logo_format', sa.String(length=20), nullable=True))
    op.add_column('organizations', sa.Column('logo_updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('organizations', 'logo_updated_at')
    op.drop_column('organizations', 'logo_format')
    op.drop_column('organizations', 'logo_resource_type')
    op.drop_column('organizations', 'logo_public_id')
