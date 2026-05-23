"""Replace enum columns with string columns

Revision ID: 002
Revises: 001
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # threat_events — zamień enumy na stringi
    op.execute("ALTER TABLE threat_events ALTER COLUMN threat_type TYPE VARCHAR USING threat_type::text")
    op.execute("ALTER TABLE threat_events ALTER COLUMN status TYPE VARCHAR USING status::text")

    # Usuń stare typy enum jeśli istnieją
    op.execute("DROP TYPE IF EXISTS threattype CASCADE")
    op.execute("DROP TYPE IF EXISTS threatstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS dependencytype CASCADE")


def downgrade() -> None:
    pass
