from services.database import get_db_connection
from fastapi import HTTPException
from services.evidence_service import _ensure_evidence_exists

CONFIDENCE_THRESHOLD = 0.7


def get_pending_signals(evidence_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
                SELECT Id, signal_type, raw_value, normalized_value,
                       confidence, source_locator, triage_reason
                FROM PendingSignal
                WHERE evidence_id = ? AND triage_status = 'pending'
                ORDER BY confidence DESC
            """, (evidence_id,))
        rows = cursor.fetchall()
        return [
            {
                "id": str(row[0]),
                "signal_type": row[1],
                "raw_value": row[2],
                "normalized_value": row[3],
                "confidence": row[4],
                "source_locator": row[5],
                "triage_reason": row[6],
            }
            for row in rows
        ]
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()


def get_signal_history(evidence_id):
    """
    Returns all confirmed and rejected signals for a given evidence item.
    Confirmed signals come from the Signal table.
    Rejected signals come from PendingSignal with triage_status = 'rejected'.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Confirmed signals from Signal table
        cursor.execute(
            """
                SELECT 
                    CAST(s.Id AS NVARCHAR(36)) AS id,
                    s.signal_type,
                    s.raw_value,
                    s.normalized_value,
                    s.confidence,
                    s.source_locator,
                    'confirmed' AS status,
                    NULL AS triage_reason,
                    NULL AS reviewed_at
                FROM Signal s
                WHERE s.evidence_id = ?
                ORDER BY s.confidence DESC
            """, (evidence_id,))

        confirmed_rows = cursor.fetchall()
        confirmed_cols = [col[0] for col in cursor.description]
        confirmed = [dict(zip(confirmed_cols, row)) for row in confirmed_rows]

        # Rejected signals from PendingSignal
        cursor.execute(
            """
                SELECT 
                    CAST(Id AS NVARCHAR(36)) AS id,
                    signal_type,
                    raw_value,
                    normalized_value,
                    confidence,
                    source_locator,
                    'rejected' AS status,
                    triage_reason,
                    CAST(reviewed_at AS NVARCHAR(50)) AS reviewed_at
                FROM PendingSignal
                WHERE evidence_id = ? AND triage_status = 'rejected'
                ORDER BY confidence DESC
            """, (evidence_id,))

        rejected_rows = cursor.fetchall()
        rejected_cols = [col[0] for col in cursor.description]
        rejected = [dict(zip(rejected_cols, row)) for row in rejected_rows]

        return {
            "message": "Success",
            "confirmed": confirmed,
            "rejected": rejected,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()


def reject_pending_signals(pending_signal_id):
    """Soft-delete: mark as rejected instead of hard deleting."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1 FROM PendingSignal WHERE Id = ?", (pending_signal_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Pending signal not found.")

        cursor.execute(
            """
                UPDATE PendingSignal
                SET triage_status = 'rejected',
                    reviewed_at = SYSDATETIMEOFFSET()
                WHERE Id = ?
            """, (pending_signal_id,))
        conn.commit()

    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()


def confirm_pending_signal(pending_signal_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
                SELECT evidence_id, attachment_id, analysis_run_id, signal_type,
                raw_value, normalized_value, confidence, source_locator FROM PendingSignal 
                WHERE ID = ?
            """, (pending_signal_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="pending_signal_id is not valid")

        _ensure_evidence_exists(cursor, row[0])

        cursor.execute(
            """
                INSERT INTO Signal
                    (evidence_id, attachment_id, analysis_run_id, signal_type,
                    raw_value, normalized_value, confidence, source_locator)
                    OUTPUT INSERTED.Id
                    VALUES (?,?,?,?,?,?,?,?)
            """, (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]))

        signal_id = cursor.fetchone()

        # Soft-delete from PendingSignal by marking confirmed
        cursor.execute(
            """
                UPDATE PendingSignal
                SET triage_status = 'confirmed',
                    reviewed_at = SYSDATETIMEOFFSET()
                WHERE Id = ?
            """, (pending_signal_id,))

        conn.commit()
        return {"signal_id": str(signal_id[0])}

    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()
