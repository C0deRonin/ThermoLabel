"""Initial schema creation

Revision ID: 001
Revises: 
Create Date: 2024-02-20 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('image_data', sa.LargeBinary(), nullable=True),
        sa.Column('image_width', sa.Integer(), nullable=True),
        sa.Column('image_height', sa.Integer(), nullable=True),
        sa.Column('palette', sa.String(50), nullable=False, server_default='iron'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Create annotation_classes table
    op.create_table(
        'annotation_classes',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('project_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('color', sa.String(7), nullable=False),
        sa.Column('temp_min', sa.Float(), nullable=True),
        sa.Column('temp_max', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create annotations table
    op.create_table(
        'annotations',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('project_id', sa.String(36), nullable=False),
        sa.Column('class_id', sa.String(36), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('x', sa.Float(), nullable=True),
        sa.Column('y', sa.Float(), nullable=True),
        sa.Column('width', sa.Float(), nullable=True),
        sa.Column('height', sa.Float(), nullable=True),
        sa.Column('points', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('avg_temperature', sa.Float(), nullable=True),
        sa.Column('min_temperature', sa.Float(), nullable=True),
        sa.Column('max_temperature', sa.Float(), nullable=True),
        sa.Column('export_formats', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['class_id'], ['annotation_classes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create analytics table
    op.create_table(
        'analytics',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('project_id', sa.String(36), nullable=False),
        sa.Column('total_annotations', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_classes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('class_distribution', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('avg_temperature', sa.Float(), nullable=True),
        sa.Column('min_temperature', sa.Float(), nullable=True),
        sa.Column('max_temperature', sa.Float(), nullable=True),
        sa.Column('bbox_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('polygon_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('threshold_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create export_logs table
    op.create_table(
        'export_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('project_id', sa.String(36), nullable=False),
        sa.Column('format', sa.String(20), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='completed'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_annotation_classes_project_id', 'annotation_classes', ['project_id'])
    op.create_index('ix_annotations_project_id', 'annotations', ['project_id'])
    op.create_index('ix_annotations_class_id', 'annotations', ['class_id'])
    op.create_index('ix_analytics_project_id', 'analytics', ['project_id'])
    op.create_index('ix_export_logs_project_id', 'export_logs', ['project_id'])
    op.create_index('ix_projects_created_at', 'projects', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_projects_created_at')
    op.drop_index('ix_export_logs_project_id')
    op.drop_index('ix_analytics_project_id')
    op.drop_index('ix_annotations_class_id')
    op.drop_index('ix_annotations_project_id')
    op.drop_index('ix_annotation_classes_project_id')

    # Drop tables
    op.drop_table('export_logs')
    op.drop_table('analytics')
    op.drop_table('annotations')
    op.drop_table('annotation_classes')
    op.drop_table('projects')
