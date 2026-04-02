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

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()


def reject_pending_signals(pending_signal_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT 1 FROM PendingSignal WHERE Id = ?", (pending_signal_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Pending signal not found.")

        cursor.execute(
            """
                DELETE FROM PendingSignal WHERE Id = ?
            """,(pending_signal_id,)
        )
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

        cursor.execute(
            """
                DELETE FROM PendingSignal WHERE Id = ?
            """, (pending_signal_id,)
        )

        conn.commit()
        return {"signal_id": str(signal_id[0])}


    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()
