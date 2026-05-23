"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('infrastructure_nodes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('risk', sa.String(), nullable=False, server_default='medium'),
        sa.Column('sector', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('resources', postgresql.JSONB(), nullable=True, server_default='{}'),
        sa.Column('hours_until_critical', sa.Float(), nullable=True),
        sa.Column('extra_data', postgresql.JSONB(), nullable=True, server_default='{}'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_infrastructure_nodes_id', 'infrastructure_nodes', ['id'])
    op.create_index('ix_infrastructure_nodes_category', 'infrastructure_nodes', ['category'])

    op.create_table('infrastructure_edges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_id', sa.Integer(), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=False),
        sa.Column('dependency_type', sa.String(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('hours_to_impact', sa.Float(), nullable=True, server_default='0'),
        sa.Column('description', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['source_id'], ['infrastructure_nodes.id']),
        sa.ForeignKeyConstraint(['target_id'], ['infrastructure_nodes.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('threat_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('threat_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='detected'),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('predicted_target_id', sa.Integer(), nullable=True),
        sa.Column('predicted_target_confidence', sa.Float(), nullable=True, server_default='0'),
        sa.Column('flight_path', postgresql.JSONB(), nullable=True, server_default='[]'),
        sa.Column('ai_recommendation', postgresql.JSONB(), nullable=True, server_default='{}'),
        sa.Column('detected_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('threat_events')
    op.drop_table('infrastructure_edges')
    op.drop_index('ix_infrastructure_nodes_category', 'infrastructure_nodes')
    op.drop_index('ix_infrastructure_nodes_id', 'infrastructure_nodes')
    op.drop_table('infrastructure_nodes')
