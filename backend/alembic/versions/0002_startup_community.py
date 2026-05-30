"""Startup community schema.

Revision ID: 0002_startup_community
Revises: 0001_initial
Create Date: 2026-05-30
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0002_startup_community"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "communities" not in tables:
        op.create_table(
            "communities",
            sa.Column("id", sa.UUID(), primary_key=True),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("type", sa.String(length=80), nullable=False, server_default="founder_community"),
            sa.Column("city", sa.String(length=120), nullable=False, server_default=""),
            sa.Column("description", sa.Text(), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    if "memberships" not in tables:
        op.create_table(
            "memberships",
            sa.Column("id", sa.UUID(), primary_key=True),
            sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column(
                "community_id",
                sa.UUID(),
                sa.ForeignKey("communities.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("role", sa.String(length=80), nullable=False, server_default="member"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    profile_columns = {column["name"] for column in inspector.get_columns("profiles")}
    additions = [
        ("community_id", sa.Column("community_id", sa.UUID(), sa.ForeignKey("communities.id", ondelete="SET NULL"))),
        ("role", sa.Column("role", sa.String(length=80), nullable=False, server_default="Founder")),
        ("stage", sa.Column("stage", sa.String(length=120), nullable=False, server_default="")),
        ("skills", sa.Column("skills", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}")),
        ("current_ask", sa.Column("current_ask", sa.Text(), nullable=False, server_default="")),
        ("offering", sa.Column("offering", sa.Text(), nullable=False, server_default="")),
        ("availability", sa.Column("availability", sa.String(length=160), nullable=False, server_default="")),
    ]
    for name, column in additions:
        if name not in profile_columns:
            op.add_column("profiles", column)

    permission_columns = {column["name"] for column in inspector.get_columns("permissions")}
    if "can_discuss_dating" in permission_columns:
        op.drop_column("permissions", "can_discuss_dating")
    if "dating_mode" in profile_columns:
        op.drop_column("profiles", "dating_mode")
    if "posts" in tables:
        op.drop_table("posts")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    profile_columns = {column["name"] for column in inspector.get_columns("profiles")}
    if "dating_mode" not in profile_columns:
        op.add_column("profiles", sa.Column("dating_mode", sa.Boolean(), nullable=False, server_default=sa.false()))
    for name in ["availability", "offering", "current_ask", "skills", "stage", "role", "community_id"]:
        if name in profile_columns:
            op.drop_column("profiles", name)

    permission_columns = {column["name"] for column in inspector.get_columns("permissions")}
    if "can_discuss_dating" not in permission_columns:
        op.add_column(
            "permissions",
            sa.Column("can_discuss_dating", sa.Boolean(), nullable=False, server_default=sa.false()),
        )

    if "memberships" in tables:
        op.drop_table("memberships")
    if "communities" in tables:
        op.drop_table("communities")
