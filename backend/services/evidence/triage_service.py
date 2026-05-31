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
                SELECT ps.Id, ps.signal_type, ps.raw_value, ps.normalized_value,
                       ps.confidence, ps.source_locator, ps.triage_reason,
                       CAST(ei.case_id AS NVARCHAR(36)) AS case_id,
                       c.title AS case_title
                FROM PendingSignal ps
                JOIN EvidenceItem ei ON ei.Id = ps.evidence_id
                JOIN Cases c ON c.case_id = ei.case_id
                WHERE ps.evidence_id = ? AND ps.triage_status = 'pending'
                ORDER BY ps.confidence DESC
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
                "case_id": row[7],
                "case_title": row[8],
            }
            for row in rows
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()


def get_pending_signals_for_case(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
                SELECT ps.Id, ps.signal_type, ps.raw_value, ps.normalized_value,
                       ps.confidence, ps.source_locator, ps.triage_reason,
                       CAST(ps.evidence_id AS NVARCHAR(36)) AS evidence_id,
                       CAST(ei.case_id AS NVARCHAR(36)) AS case_id,
                       c.title AS case_title
                FROM PendingSignal ps
                JOIN EvidenceItem ei ON ps.evidence_id = ei.Id
                JOIN Cases c ON c.case_id = ei.case_id
                WHERE ei.case_id = ? AND ps.triage_status = 'pending'
                ORDER BY ps.confidence DESC
            """, (case_id,))

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
                "evidence_id": str(row[7]),
                "case_id": row[8],
                "case_title": row[9],
            }
            for row in rows
        ]

    except Exception:
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
                UPDATE PendingSignal
                SET triage_status = 'rejected', reviewed_at = GETUTCDATE()
                WHERE Id = ?
            """, (pending_signal_id,)
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

        normalized = row[5] or ''
        source_locator = (row[7] or '')[:200]

        cursor.execute(
            """
                INSERT INTO Signal
                    (evidence_id, attachment_id, analysis_run_id, signal_type,
                    raw_value, normalized_value, confidence, source_locator)
                    OUTPUT INSERTED.Id
                    VALUES (?,?,?,?,?,?,?,?)
            """, (row[0], row[1], row[2], row[3], row[4], normalized, row[6], source_locator))
        

        signal_id = cursor.fetchone()
        #cross-case correlation: find other cases with the same confirmed signal

        new_evidence_id = row[0]
        new_signal_type = row[3]
        new_raw_value   = row[4]
        new_confidence  = row[6]

        cursor.execute(
            """
            INSERT INTO CaseCorrelation (case_id_a, case_id_b, signal_type, shared_value, confidence)
            SELECT DISTINCT 
                CAST(ei_a.case_id AS NVARCHAR(50)),
                CAST(ei_b.case_id AS NVARCHAR(50)),
                ?,
                ?,
                ?
            FROM EvidenceItem ei_a
            JOIN EvidenceItem ei_b
                ON ei_b.case_id != ei_a.case_id
            JOIN Signal s_other
                ON s_other.evidence_id = ei_b.Id
               AND s_other.signal_type = ?
               AND s_other.raw_value   = ?
            WHERE ei_a.Id = ?
                AND NOT EXISTS (
                    SELECT 1 FROM CaseCorrelation cc
                    WHERE cc.case_id_a = CAST(ei_a.case_id AS NVARCHAR(50))
                        AND cc.case_id_b = CAST(ei_b.case_id AS NVARCHAR(50))
                        AND cc.shared_value = ?
                )
            """,
            (new_signal_type, new_raw_value, new_confidence,
             new_signal_type, new_raw_value, new_evidence_id, new_raw_value)
        )

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


def get_signal_history(evidence_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Confirmed signals (from Signal table — regex-extracted, auto-confirmed)
        cursor.execute("""
            SELECT
                CAST(Id AS NVARCHAR(36)) AS id,
                signal_type, raw_value, normalized_value,
                confidence, source_locator,
                'confirmed' AS status,
                NULL AS triage_reason,
                NULL AS reviewed_at
            FROM Signal
            WHERE evidence_id = ?
            ORDER BY confidence DESC
        """, (str(evidence_id),))
        rows = cursor.fetchall()
        cols = [col[0] for col in cursor.description]
        confirmed = [dict(zip(cols, r)) for r in rows]

        # Confirmed/rejected signals (from PendingSignal — LLM-extracted, triaged)
        cursor.execute("""
            SELECT
                CAST(Id AS NVARCHAR(36)) AS id,
                signal_type, raw_value, normalized_value,
                confidence, source_locator,
                triage_status AS status,
                triage_reason,
                CAST(reviewed_at AS NVARCHAR(50)) AS reviewed_at
            FROM PendingSignal
            WHERE evidence_id = ? AND triage_status IN ('confirmed', 'rejected')
            ORDER BY confidence DESC
        """, (str(evidence_id),))
        rows = cursor.fetchall()
        cols = [col[0] for col in cursor.description]
        triaged = [dict(zip(cols, r)) for r in rows]

        confirmed += [s for s in triaged if s['status'] == 'confirmed']
        rejected   = [s for s in triaged if s['status'] == 'rejected']

        return {"confirmed": confirmed, "rejected": rejected}
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()
