"""
Enterprise Stock Service — Single Source of Truth
==================================================
ALL stock balance, valuation, and analytics queries live here.
No frontend calculations.  No derived totals stored in UI.

Core rules
----------
1.  ``stock_movements`` with ``approval_status = 'APPROVED'`` is the ONLY authority.
2.  Available stock  = SUM(APPROVED IN) − SUM(APPROVED OUT)  per item.
3.  Valuation uses weighted-average cost tracked on ``products.weighted_avg_cost``.
4.  Low-stock alerts fire when available stock ≤ ``products.minimum_stock_level``.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import case, func, text
from sqlalchemy.orm import Session

from models import Product, StockMovement, User, UserRole

logger = logging.getLogger(__name__)

# ────────────────────────────────────────────────────────
#  STOCK BALANCE (approved only)
# ────────────────────────────────────────────────────────

def get_item_stock_balance(db: Session, item_name: str) -> int:
    """Available stock for a single item (approved movements only)."""
    row = (
        db.query(
            func.coalesce(
                func.sum(
                    case(
                        (StockMovement.movement_type == "IN", StockMovement.quantity),
                        else_=-StockMovement.quantity,
                    )
                ),
                0,
            )
        )
        .filter(
            StockMovement.item_name == item_name,
            StockMovement.approval_status == "APPROVED",
        )
        .scalar()
    )
    return int(row)


def get_all_stock_balances(db: Session) -> list[dict]:
    """Per-item available stock across all items (approved only)."""
    rows = (
        db.query(
            StockMovement.item_name,
            func.sum(
                case(
                    (StockMovement.movement_type == "IN", StockMovement.quantity),
                    else_=-StockMovement.quantity,
                )
            ).label("balance"),
        )
        .filter(StockMovement.approval_status == "APPROVED")
        .group_by(StockMovement.item_name)
        .all()
    )
    return [{"item_name": r.item_name, "available_stock": int(r.balance)} for r in rows]


# ────────────────────────────────────────────────────────
#  APPROVAL WORKFLOW
# ────────────────────────────────────────────────────────

def approve_movement(
    db: Session, movement_id: int, admin_user: User
) -> StockMovement:
    """Admin approves a PENDING movement.  Updates product WAC on IN."""
    movement = db.query(StockMovement).filter(StockMovement.id == movement_id).first()
    if not movement:
        raise ValueError("Stock movement not found")
    if movement.approval_status != "PENDING":
        raise ValueError("Only PENDING movements can be approved")

    movement.approval_status = "APPROVED"
    movement.approved_by = admin_user.id
    movement.approved_at = datetime.utcnow()

    # Recalculate weighted-average cost on APPROVED IN
    if movement.movement_type == "IN" and movement.unit_cost and movement.unit_cost > 0:
        _update_weighted_avg_cost(db, movement)

    db.flush()
    return movement


def reject_movement(
    db: Session, movement_id: int, admin_user: User
) -> StockMovement:
    """Admin rejects a PENDING movement.  Never counted anywhere."""
    movement = db.query(StockMovement).filter(StockMovement.id == movement_id).first()
    if not movement:
        raise ValueError("Stock movement not found")
    if movement.approval_status != "PENDING":
        raise ValueError("Only PENDING movements can be rejected")

    movement.approval_status = "REJECTED"
    movement.approved_by = admin_user.id
    movement.approved_at = datetime.utcnow()
    db.flush()
    return movement


# ────────────────────────────────────────────────────────
#  PAYMENT CONTROL
# ────────────────────────────────────────────────────────

def mark_paid(db: Session, movement_id: int, user: User) -> StockMovement:
    """
    Mark a movement as PAID.
    Rules:
      - Cannot revert PAID → PENDING
    """
    movement = db.query(StockMovement).filter(StockMovement.id == movement_id).first()
    if not movement:
        raise ValueError("Stock movement not found")
    if movement.payment_status == "PAID":
        raise ValueError("Already marked as PAID — cannot revert")

    movement.payment_status = "PAID"
    movement.payment_updated_by = user.id
    movement.payment_updated_at = datetime.utcnow()
    db.flush()
    return movement


# ────────────────────────────────────────────────────────
#  VALUATION (weighted average cost)
# ────────────────────────────────────────────────────────

def _update_weighted_avg_cost(db: Session, movement: StockMovement):
    """Recalculate WAC after an IN is APPROVED."""
    # Find matching product by name (best-effort)
    product = (
        db.query(Product).filter(Product.name == movement.item_name).first()
    )
    if not product:
        return  # No product master entry — skip

    old_stock = max(get_item_stock_balance(db, movement.item_name) - movement.quantity, 0)
    old_cost = product.weighted_avg_cost or 0.0
    new_qty = movement.quantity
    new_cost = movement.unit_cost

    total_stock = old_stock + new_qty
    if total_stock > 0:
        product.weighted_avg_cost = (
            (old_stock * old_cost) + (new_qty * new_cost)
        ) / total_stock
    else:
        product.weighted_avg_cost = new_cost


def get_stock_valuation(db: Session) -> list[dict]:
    """Per-item valuation: available_stock × weighted_avg_cost."""
    balances = {b["item_name"]: b["available_stock"] for b in get_all_stock_balances(db)}

    products = db.query(Product).filter(Product.status == "Active").all()
    result = []
    for p in products:
        qty = balances.get(p.name, 0)
        wac = p.weighted_avg_cost or 0.0
        result.append(
            {
                "product_id": p.id,
                "product_name": p.name,
                "category": p.category,
                "available_stock": qty,
                "weighted_avg_cost": round(wac, 2),
                "total_value": round(qty * wac, 2),
                "minimum_stock_level": p.minimum_stock_level or 0,
                "is_low_stock": qty <= (p.minimum_stock_level or 0)
                if (p.minimum_stock_level or 0) > 0
                else False,
            }
        )
    return result


def get_total_inventory_value(db: Session) -> float:
    """Sum of all product values."""
    return round(sum(v["total_value"] for v in get_stock_valuation(db)), 2)


# ────────────────────────────────────────────────────────
#  LOW-STOCK ALERTS
# ────────────────────────────────────────────────────────

def get_low_stock_alerts(db: Session) -> list[dict]:
    """Products where available stock ≤ minimum_stock_level."""
    return [v for v in get_stock_valuation(db) if v["is_low_stock"]]


# ────────────────────────────────────────────────────────
#  ANALYTICS  (all queries filter approval_status = APPROVED)
# ────────────────────────────────────────────────────────

def get_summary_stats(db: Session) -> dict:
    """Dashboard-level counters — approved movements only."""
    base = db.query(StockMovement).filter(StockMovement.approval_status == "APPROVED")

    total_in = (
        base.filter(StockMovement.movement_type == "IN")
        .with_entities(func.coalesce(func.sum(StockMovement.quantity), 0))
        .scalar()
    )
    total_out = (
        base.filter(StockMovement.movement_type == "OUT")
        .with_entities(func.coalesce(func.sum(StockMovement.quantity), 0))
        .scalar()
    )
    paid_count = base.filter(StockMovement.payment_status == "PAID").count()
    pending_payment = base.filter(StockMovement.payment_status == "PENDING").count()
    pending_approval = (
        db.query(StockMovement)
        .filter(StockMovement.approval_status == "PENDING")
        .count()
    )

    return {
        "total_approved_in": int(total_in),
        "total_approved_out": int(total_out),
        "paid_count": paid_count,
        "pending_payment_count": pending_payment,
        "pending_approval_count": pending_approval,
        "total_inventory_value": get_total_inventory_value(db),
    }


def get_engineer_analytics(
    db: Session, period: str = "week"
) -> dict:
    """Engineer-wise stock usage — APPROVED movements only."""
    today = date.today()
    start = today - timedelta(days=7 if period == "week" else 30)

    movements = (
        db.query(StockMovement)
        .filter(
            StockMovement.movement_type == "OUT",
            StockMovement.approval_status == "APPROVED",
            StockMovement.date >= start,
            StockMovement.engineer_id.isnot(None),
        )
        .all()
    )

    engineers: dict[int, dict] = {}
    for m in movements:
        eid = m.engineer_id
        if eid not in engineers:
            eng = db.query(User).filter(User.id == eid).first()
            engineers[eid] = {
                "engineer_id": eid,
                "engineer_name": eng.full_name if eng else "Unknown",
                "total_items_taken": 0,
                "total_movements": 0,
                "total_cost": 0.0,
                "paid_count": 0,
                "pending_count": 0,
                "movements_detail": [],
            }

        e = engineers[eid]
        e["total_items_taken"] += m.quantity
        e["total_movements"] += 1
        e["total_cost"] += (m.unit_cost or 0) * m.quantity

        if m.payment_status == "PAID":
            e["paid_count"] += 1
        else:
            e["pending_count"] += 1

        e["movements_detail"].append(
            {
                "id": m.id,
                "date": m.date.isoformat(),
                "item_name": m.item_name,
                "quantity": m.quantity,
                "unit_cost": m.unit_cost or 0,
                "payment_status": m.payment_status or "PENDING",
                "service_request_id": m.service_request_id,
                "notes": m.notes,
            }
        )

    return {
        "period": period,
        "start_date": start.isoformat(),
        "end_date": today.isoformat(),
        "engineers": list(engineers.values()),
    }


def get_engineer_own_usage(db: Session, engineer_id: int) -> dict:
    """Current engineer's stock usage (approved only)."""
    today = date.today()
    week_start = today - timedelta(days=7)

    def _serialize(movements):
        return [
            {
                "id": m.id,
                "item_name": m.item_name,
                "quantity": m.quantity,
                "unit_cost": m.unit_cost or 0,
                "approval_status": m.approval_status or "PENDING",
                "payment_status": m.payment_status or "PENDING",
                "service_request_id": m.service_request_id,
                "date": m.date.isoformat(),
            }
            for m in movements
        ]

    today_q = (
        db.query(StockMovement)
        .filter(
            StockMovement.engineer_id == engineer_id,
            StockMovement.movement_type == "OUT",
            StockMovement.date == today,
        )
        .all()
    )
    week_q = (
        db.query(StockMovement)
        .filter(
            StockMovement.engineer_id == engineer_id,
            StockMovement.movement_type == "OUT",
            StockMovement.date >= week_start,
        )
        .all()
    )

    eng = db.query(User).filter(User.id == engineer_id).first()

    return {
        "engineer_id": engineer_id,
        "engineer_name": eng.full_name if eng else "Unknown",
        "today": {
            "movements_count": len(today_q),
            "total_items": sum(m.quantity for m in today_q),
            "movements": _serialize(today_q),
        },
        "this_week": {
            "movements_count": len(week_q),
            "total_items": sum(m.quantity for m in week_q),
            "paid_count": sum(1 for m in week_q if m.payment_status == "PAID"),
            "pending_count": sum(1 for m in week_q if m.payment_status != "PAID"),
            "movements": _serialize(week_q),
        },
    }
