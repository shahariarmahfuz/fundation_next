"""make_member_fields_optional_and_add_profile_fields

Revision ID: d4e5f6a7b8c9
Revises: c1f839a04a11
Create Date: 2026-10-02 11:46:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c1f839a04a11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Make phone and joining_date nullable in members table
    op.alter_column('members', 'phone',
               existing_type=sa.VARCHAR(length=50),
               nullable=True)
    op.alter_column('members', 'joining_date',
               existing_type=sa.Date(),
               nullable=True)

    # 2. Add extended optional profile fields to members table if not existing
    conn = op.get_bind()
    existing_cols = [c['name'] for c in sa.inspect(conn).get_columns('members')]

    new_columns = [
        ('father_name', sa.String(150)),
        ('mother_name', sa.String(150)),
        ('date_of_birth', sa.Date()),
        ('gender', sa.String(20)),
        ('occupation', sa.String(150)),
        ('education', sa.String(150)),
        ('blood_group', sa.String(20)),
        ('marital_status', sa.String(30)),
        ('alternative_phone', sa.String(50)),
        ('present_address', sa.String(255)),
        ('permanent_address', sa.String(255)),
        ('emergency_contact_name', sa.String(150)),
        ('emergency_contact_relationship', sa.String(50)),
        ('emergency_contact_phone', sa.String(50)),
        ('reference_name', sa.String(150)),
        ('reference_phone', sa.String(50)),
        ('reference_relationship', sa.String(50)),
        ('commitment', sa.Text()),
        ('photo_url', sa.String(500)),
        ('signature_url', sa.String(500)),
        ('document_type', sa.String(50)),
        ('nid_front_url', sa.String(500)),
        ('nid_back_url', sa.String(500)),
        ('reason_for_joining', sa.Text()),
    ]

    for col_name, col_type in new_columns:
        if col_name not in existing_cols:
            op.add_column('members', sa.Column(col_name, col_type, nullable=True))


def downgrade() -> None:
    pass
