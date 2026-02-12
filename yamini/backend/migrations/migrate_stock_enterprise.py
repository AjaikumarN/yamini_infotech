"""
Migration: Enterprise Stock System — add unit_cost, minimum_stock_level, weighted_avg_cost
Date: 2026-02-11
Safe: additive only — no data deleted, no columns dropped, no renames
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine


def upgrade():
    with engine.connect() as conn:
        # ── stock_movements ──
        sm_cols = {
            r[0]
            for r in conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = 'stock_movements'"
                )
            ).fetchall()
        }

        sm_adds = []
        if "unit_cost" not in sm_cols:
            sm_adds.append(
                "ALTER TABLE stock_movements ADD COLUMN unit_cost DOUBLE PRECISION DEFAULT 0"
            )
        if "approved_by" not in sm_cols:
            sm_adds.append(
                "ALTER TABLE stock_movements ADD COLUMN approved_by INTEGER REFERENCES users(id)"
            )
        if "approved_at" not in sm_cols:
            sm_adds.append(
                "ALTER TABLE stock_movements ADD COLUMN approved_at TIMESTAMP"
            )
        # delivery_status may already exist from old schema
        if "delivery_status" not in sm_cols:
            sm_adds.append(
                "ALTER TABLE stock_movements ADD COLUMN delivery_status VARCHAR"
            )
        if "whatsapp_delivery_failed_sent" not in sm_cols:
            sm_adds.append(
                "ALTER TABLE stock_movements ADD COLUMN whatsapp_delivery_failed_sent BOOLEAN DEFAULT FALSE"
            )
        if "whatsapp_delivery_reattempt_sent" not in sm_cols:
            sm_adds.append(
                "ALTER TABLE stock_movements ADD COLUMN whatsapp_delivery_reattempt_sent BOOLEAN DEFAULT FALSE"
            )

        for stmt in sm_adds:
            print(f"  [stock_movements] {stmt}")
            conn.execute(text(stmt))
            print("    ✓")

        # ── products ──
        p_cols = {
            r[0]
            for r in conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = 'products'"
                )
            ).fetchall()
        }

        p_adds = []
        if "minimum_stock_level" not in p_cols:
            p_adds.append(
                "ALTER TABLE products ADD COLUMN minimum_stock_level INTEGER DEFAULT 0"
            )
        if "weighted_avg_cost" not in p_cols:
            p_adds.append(
                "ALTER TABLE products ADD COLUMN weighted_avg_cost DOUBLE PRECISION DEFAULT 0"
            )

        for stmt in p_adds:
            print(f"  [products] {stmt}")
            conn.execute(text(stmt))
            print("    ✓")

        conn.commit()

        total = len(sm_adds) + len(p_adds)
        if total:
            print(f"\n✅ Migration complete — {total} column(s) added.")
        else:
            print("\n✅ All columns already exist. Nothing to do.")


if __name__ == "__main__":
    print("=== Enterprise Stock Migration ===")
    upgrade()
