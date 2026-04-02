from services.database import get_db_connection
from fastapi import HTTPException

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
