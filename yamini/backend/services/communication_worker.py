"""
Communication Worker — Background Queue Processor
===================================================

Runs as a SEPARATE process (not inside FastAPI).
Polls communication_queue every 8 seconds.

    python services/communication_worker.py

Features:
  • FOR UPDATE SKIP LOCKED — no duplicate processing
  • Exponential retry: 1m → 5m → 15m → 30m → 60m
  • Survives server restart (queue is DB-persisted)
  • WhatsApp sending happens HERE ONLY (never in routers)
"""

import os
import sys
import json
import time
import signal
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path

# Ensure project root is on sys.path so we can import database / models
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
load_dotenv(PROJECT_ROOT / ".env")

from database import SessionLocal
from sqlalchemy import text

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [WORKER] %(levelname)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("communication_worker")

# ---------------------------------------------------------------------------
# Retry schedule (minutes) — index = retry_count
# ---------------------------------------------------------------------------
RETRY_DELAYS_MINUTES = [1, 5, 15, 30, 60]
MAX_RETRIES = 5
POLL_INTERVAL = 8  # seconds

# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------
_running = True

def _handle_signal(sig, frame):
    global _running
    logger.info("Received shutdown signal — finishing current batch…")
    _running = False

signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)

# ---------------------------------------------------------------------------
# WhatsApp sending (moved from routers to here)
# ---------------------------------------------------------------------------

# Safe import of pywhatkit
try:
    import pywhatkit as kit
    PYWHATKIT_AVAILABLE = True
    logger.info("✅ PyWhatKit loaded")
except Exception as e:
    PYWHATKIT_AVAILABLE = False
    logger.warning(f"⚠️  PyWhatKit unavailable (headless?): {e}")


def _normalize_phone(phone: str):
    """Normalize to +91XXXXXXXXXX."""
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    if len(digits) == 11 and digits.startswith("0"):
        return f"+91{digits[1:]}"
    if 10 <= len(digits) <= 15:
        return f"+{digits}"
    return None


def send_whatsapp(phone: str, message: str) -> tuple:
    """
    Send a single WhatsApp message.
    Returns (success: bool, error: str | None).
    """
    normalized = _normalize_phone(phone)
    if not normalized:
        return False, f"Invalid phone: {phone}"

    if not PYWHATKIT_AVAILABLE:
        # On headless servers, log and mark as sent (simulated)
        # Replace this block with a real WhatsApp Business API call in production
        logger.info(f"📱 [SIM] WhatsApp → {normalized}: {message[:60]}…")
        return True, None

    try:
        kit.sendwhatmsg_instantly(
            phone_no=normalized,
            message=message,
            wait_time=15,
            tab_close=True,
            close_time=3,
        )
        logger.info(f"✅ WhatsApp sent → {normalized}")
        return True, None
    except Exception as e:
        return False, str(e)


def _log_whatsapp_to_audit(db, event_type, phone, customer_name, message, status, ref_table, ref_id, error):
    """Write to whatsapp_message_logs (audit trail)."""
    try:
        db.execute(text("""
            INSERT INTO whatsapp_message_logs
                (event_type, customer_phone, customer_name, message_content,
                 status, reference_type, reference_id, error_message, created_at)
            VALUES
                (:et, :phone, :name, :msg, :status, :rt, :rid, :err, NOW())
        """), {
            "et": event_type, "phone": phone, "name": customer_name,
            "msg": message, "status": status,
            "rt": ref_table, "rid": ref_id, "err": error,
        })
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Audit log write failed: {e}")


# ---------------------------------------------------------------------------
# Core loop
# ---------------------------------------------------------------------------

def process_batch():
    """Fetch QUEUED jobs and process them one by one."""
    db = SessionLocal()
    try:
        # Fetch up to 10 jobs that are QUEUED and ready
        rows = db.execute(text("""
            SELECT id, channel, recipient_phone, event_type,
                   reference_table, reference_id, message_payload_json,
                   retry_count
            FROM communication_queue
            WHERE status = 'QUEUED'
              AND (next_retry_at IS NULL OR next_retry_at <= NOW())
            ORDER BY created_at ASC
            LIMIT 10
            FOR UPDATE SKIP LOCKED
        """)).fetchall()

        if not rows:
            return 0

        processed = 0
        for row in rows:
            qid, channel, phone, event_type, ref_table, ref_id, payload_json, retries = row

            # Mark processing
            db.execute(text("""
                UPDATE communication_queue SET status = 'PROCESSING' WHERE id = :id
            """), {"id": qid})
            db.commit()

            # Parse payload
            try:
                payload = json.loads(payload_json) if payload_json else {}
            except json.JSONDecodeError:
                payload = {}

            message = payload.get("message", "")
            customer_name = payload.get("customer_name", "")

            # --- Send based on channel ---
            success, error = False, "Unsupported channel"
            if channel == "WHATSAPP":
                success, error = send_whatsapp(phone, message)
            elif channel == "SMS":
                # Placeholder for SMS gateway
                logger.info(f"📱 [SMS placeholder] → {phone}")
                success, error = True, None
            elif channel == "EMAIL":
                # Placeholder for email sending
                logger.info(f"📧 [EMAIL placeholder] → {phone}")
                success, error = True, None

            if success:
                db.execute(text("""
                    UPDATE communication_queue
                    SET status = 'SENT', processed_at = NOW(), last_error = NULL
                    WHERE id = :id
                """), {"id": qid})
                db.commit()
                logger.info(f"✅ Queue #{qid} SENT [{event_type}] → {phone}")
            else:
                new_retries = retries + 1
                if new_retries >= MAX_RETRIES:
                    db.execute(text("""
                        UPDATE communication_queue
                        SET status = 'FAILED', last_error = :err, retry_count = :rc, processed_at = NOW()
                        WHERE id = :id
                    """), {"id": qid, "err": error, "rc": new_retries})
                    db.commit()
                    logger.warning(f"❌ Queue #{qid} FAILED permanently after {MAX_RETRIES} retries")
                else:
                    delay_min = RETRY_DELAYS_MINUTES[min(new_retries - 1, len(RETRY_DELAYS_MINUTES) - 1)]
                    next_retry = datetime.utcnow() + timedelta(minutes=delay_min)
                    db.execute(text("""
                        UPDATE communication_queue
                        SET status = 'QUEUED', last_error = :err, retry_count = :rc,
                            next_retry_at = :nra
                        WHERE id = :id
                    """), {"id": qid, "err": error, "rc": new_retries, "nra": next_retry})
                    db.commit()
                    logger.info(f"🔄 Queue #{qid} retry #{new_retries} in {delay_min}m")

            # Audit log for WhatsApp
            if channel == "WHATSAPP":
                _log_whatsapp_to_audit(
                    db, event_type, phone, customer_name, message,
                    "SENT" if success else "FAILED",
                    ref_table, ref_id, error,
                )

            processed += 1

        return processed

    except Exception as e:
        db.rollback()
        logger.error(f"Batch processing error: {e}")
        return 0
    finally:
        db.close()


def run():
    """Main worker loop."""
    logger.info("=" * 60)
    logger.info("  Communication Worker Started")
    logger.info(f"  Poll interval: {POLL_INTERVAL}s | Max retries: {MAX_RETRIES}")
    logger.info("=" * 60)

    while _running:
        try:
            count = process_batch()
            if count:
                logger.info(f"Processed {count} message(s)")
        except Exception as e:
            logger.error(f"Worker loop error: {e}")

        # Sleep in small increments so we can respond to signals quickly
        for _ in range(POLL_INTERVAL * 2):
            if not _running:
                break
            time.sleep(0.5)

    logger.info("Worker stopped gracefully.")


if __name__ == "__main__":
    run()
