"""create_member_documents_table_and_cloudinary_fields

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-10-02 12:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # 1. Add Cloudinary public_id and birth_certificate columns to members table if not present
    member_cols = [
        ('photo_public_id', sa.String(255)),
        ('signature_public_id', sa.String(255)),
        ('nid_front_public_id', sa.String(255)),
        ('nid_back_public_id', sa.String(255)),
        ('birth_certificate_url', sa.String(500)),
        ('birth_certificate_public_id', sa.String(255)),
    ]
    for col_name, col_type in member_cols:
        check = conn.execute(sa.text(
            f"SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='{col_name}'"
        )).first()
        if not check:
            op.add_column('members', sa.Column(col_name, col_type, nullable=True))

    # 2. Create member_documents table if not present
    table_check = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.tables WHERE table_name='member_documents'"
    )).first()
    if not table_check:
        op.create_table(
            'member_documents',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('member_id', sa.Integer(), nullable=True),
            sa.Column('document_type', sa.String(length=50), nullable=True),
            sa.Column('document_category', sa.String(length=50), nullable=False),
            sa.Column('cloudinary_public_id', sa.String(length=255), nullable=False),
            sa.Column('secure_url', sa.String(length=500), nullable=False),
            sa.Column('resource_type', sa.String(length=50), server_default='image', nullable=False),
            sa.Column('format', sa.String(length=20), nullable=True),
            sa.Column('file_size', sa.Integer(), nullable=True),
            sa.Column('width', sa.Integer(), nullable=True),
            sa.Column('height', sa.Integer(), nullable=True),
            sa.Column('original_filename', sa.String(length=255), nullable=True),
            sa.Column('mime_type', sa.String(length=100), nullable=True),
            sa.Column('uploaded_by', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_member_documents_id'), 'member_documents', ['id'], unique=False)
        op.create_index(op.f('ix_member_documents_member_id'), 'member_documents', ['member_id'], unique=False)
        op.create_index(op.f('ix_member_documents_document_category'), 'member_documents', ['document_category'], unique=False)
        op.create_index(op.f('ix_member_documents_cloudinary_public_id'), 'member_documents', ['cloudinary_public_id'], unique=False)


def downgrade() -> None:
    op.drop_table('member_documents')
    for col_name in ['photo_public_id', 'signature_public_id', 'nid_front_public_id', 'nid_back_public_id', 'birth_certificate_url', 'birth_certificate_public_id']:
        op.drop_column('members', col_name)
