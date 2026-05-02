from dotenv import load_dotenv
from services.database import get_db_connection
import pyodbc

load_dotenv()


def _get_agent_case_ids(cursor, agent_id: int, org_id: int) -> list[int]:
    cursor.execute("""
        SELECT DISTINCT c.case_id
        FROM Cases c
        LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
        WHERE c.deleted_at IS NULL
          AND c.org_id = ?
          AND (c.created_by_user_id = ? OR ca.user_id = ?)
    """, (org_id, agent_id, agent_id))
    return [row[0] for row in cursor.fetchall()]


def get_dashboard_summary(agent_id: int, org_id: int):
    """
    Aggregates per-case note counts, evidence counts and evidence pipeline
    status across all cases the agent can access. Also tries to count
    pending signals via PendingSignal / EvidenceItem (optional tables).
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        case_ids = _get_agent_case_ids(cursor, agent_id, org_id)

        if not case_ids:
            return {
                "message": "Success",
                "case_summaries": [],
                "totals": {
                    "total_evidence": 0,
                    "ev_pending": 0,
                    "ev_processing": 0,
                    "ev_processed": 0,
                    "ev_confirmed": 0,
                    "total_pending_signals": 0,
                    "empty_cases_count": 0,
                },
            }

        placeholders = ",".join(["?" for _ in case_ids])

        cursor.execute(f"""
            SELECT
                c.case_id,
                COUNT(DISTINCT cn.note_id)  AS note_count,
                COUNT(DISTINCT e.FileId)    AS evidence_count,
                SUM(CASE WHEN e.processing_status = 'pending'    THEN 1 ELSE 0 END) AS ev_pending,
                SUM(CASE WHEN e.processing_status = 'processing' THEN 1 ELSE 0 END) AS ev_processing,
                SUM(CASE WHEN e.processing_status = 'processed'  THEN 1 ELSE 0 END) AS ev_processed,
                SUM(CASE WHEN e.processing_status = 'confirmed'  THEN 1 ELSE 0 END) AS ev_confirmed
            FROM Cases c
            LEFT JOIN case_notes cn ON cn.case_id = c.case_id
            LEFT JOIN Evidence e    ON e.case_id  = c.case_id
            WHERE c.case_id IN ({placeholders})
            GROUP BY c.case_id
        """, case_ids)

        rows = cursor.fetchall()
        cols = [col[0] for col in cursor.description]
        case_summaries = [dict(zip(cols, row)) for row in rows]

        # Optional: pending signal count per case via EvidenceItem / PendingSignal
        signal_per_case: dict[int, int] = {}
        try:
            cursor.execute(f"""
                SELECT ei.case_id, COUNT(DISTINCT ps.Id) AS signal_count
                FROM EvidenceItem ei
                JOIN PendingSignal ps ON ps.evidence_id = ei.Id
                WHERE ei.case_id IN ({placeholders})
                  AND ps.triage_status = 'pending'
                GROUP BY ei.case_id
            """, case_ids)
            for row in cursor.fetchall():
                signal_per_case[row[0]] = row[1]
        except pyodbc.Error:
            pass  # tables may not be accessible

        for cs in case_summaries:
            cs["pending_signal_count"] = signal_per_case.get(cs["case_id"], 0)

        totals = {
            "total_evidence":        sum(cs["evidence_count"]       for cs in case_summaries),
            "ev_pending":            sum(cs["ev_pending"]            for cs in case_summaries),
            "ev_processing":         sum(cs["ev_processing"]         for cs in case_summaries),
            "ev_processed":          sum(cs["ev_processed"]          for cs in case_summaries),
            "ev_confirmed":          sum(cs["ev_confirmed"]          for cs in case_summaries),
            "total_pending_signals": sum(cs["pending_signal_count"]  for cs in case_summaries),
            "empty_cases_count":     sum(
                1 for cs in case_summaries
                if cs["note_count"] == 0 and cs["evidence_count"] == 0
            ),
        }

        return {"message": "Success", "case_summaries": case_summaries, "totals": totals}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_agent_stats(agent_id: int, org_id: int):
    """
    Personal output stats for the agent: notes and evidence counts for
    the last 7 days and last 30 days, plus cases closed this month.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                SUM(CASE WHEN cn.created_at >= DATEADD(day, -7,  SYSDATETIMEOFFSET()) THEN 1 ELSE 0 END) AS notes_week,
                SUM(CASE WHEN cn.created_at >= DATEADD(day, -30, SYSDATETIMEOFFSET()) THEN 1 ELSE 0 END) AS notes_month
            FROM case_notes cn
            JOIN Cases c ON cn.case_id = c.case_id
            WHERE cn.created_by_user_id = ?
              AND c.org_id = ?
              AND c.deleted_at IS NULL
        """, (agent_id, org_id))
        row = cursor.fetchone()
        notes_week  = row[0] or 0
        notes_month = row[1] or 0

        try:
            cursor.execute("""
                SELECT
                    SUM(CASE WHEN e.upload_date >= DATEADD(day, -7,  SYSDATETIMEOFFSET()) THEN 1 ELSE 0 END) AS ev_week,
                    SUM(CASE WHEN e.upload_date >= DATEADD(day, -30, SYSDATETIMEOFFSET()) THEN 1 ELSE 0 END) AS ev_month
                FROM Evidence e
                JOIN Cases c ON e.case_id = c.case_id
                WHERE TRY_CAST(e.uploaded_by AS INT) = ?
                  AND c.org_id = ?
                  AND c.deleted_at IS NULL
            """, (agent_id, org_id))
            row = cursor.fetchone()
            evidence_week  = row[0] or 0
            evidence_month = row[1] or 0
        except pyodbc.Error:
            evidence_week  = 0
            evidence_month = 0

        cursor.execute("""
            SELECT COUNT(*)
            FROM Cases c
            LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
            WHERE c.org_id = ?
              AND c.deleted_at IS NULL
              AND c.status IN ('Solved', 'Closed')
              AND c.closed_at >= DATEADD(day, -30, SYSDATETIMEOFFSET())
              AND (c.created_by_user_id = ? OR ca.user_id = ?)
        """, (org_id, agent_id, agent_id))
        cases_closed_month = cursor.fetchone()[0] or 0

        cursor.execute("""
            SELECT COUNT(*)
            FROM Cases c
            LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
            WHERE c.org_id = ?
              AND c.deleted_at IS NULL
              AND c.created_at >= DATEADD(day, -30, SYSDATETIMEOFFSET())
              AND (c.created_by_user_id = ? OR ca.user_id = ?)
        """, (org_id, agent_id, agent_id))
        cases_opened_month = cursor.fetchone()[0] or 0

        return {
            "message": "Success",
            "notes_week":          notes_week,
            "notes_month":         notes_month,
            "evidence_week":       evidence_week,
            "evidence_month":      evidence_month,
            "cases_closed_month":  cases_closed_month,
            "cases_opened_month":  cases_opened_month,
        }

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_agent_activity(agent_id: int, org_id: int):
    """
    Recent activity across all of the agent's cases.
    Pulls the 20 most recent notes and, if available, audit log entries.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT TOP 20
                'note'                                         AS activity_type,
                cn.note_id                                     AS record_id,
                c.case_id,
                c.title                                        AS case_title,
                c.CaseNumber,
                SUBSTRING(cn.content, 1, 120)                 AS summary,
                CAST(cn.created_at AS NVARCHAR(50))           AS timestamp,
                u.first_name + ' ' + u.last_name              AS actor_name,
                cn.created_by_user_id                         AS actor_id
            FROM case_notes cn
            JOIN Cases c  ON cn.case_id           = c.case_id
            JOIN users u  ON cn.created_by_user_id = u.user_id
            LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
            WHERE c.org_id      = ?
              AND c.deleted_at IS NULL
              AND (c.created_by_user_id = ? OR ca.user_id = ?)
            ORDER BY cn.created_at DESC
        """, (org_id, agent_id, agent_id))

        rows = cursor.fetchall()
        cols = [col[0] for col in cursor.description]
        activity = [dict(zip(cols, row)) for row in rows]

        # Optional: supplement with audit log entries
        try:
            cursor.execute("""
                SELECT TOP 10
                    al.action_type                              AS activity_type,
                    al.log_id                                   AS record_id,
                    TRY_CAST(al.record_id AS INT)               AS case_id,
                    c.title                                     AS case_title,
                    c.CaseNumber,
                    al.action_type                              AS summary,
                    CAST(al.timestamp AS NVARCHAR(50))          AS timestamp,
                    u.first_name + ' ' + u.last_name            AS actor_name,
                    TRY_CAST(al.user_id AS INT)                 AS actor_id
                FROM audit_logs al
                JOIN Cases c ON c.case_id = TRY_CAST(al.record_id AS INT)
                LEFT JOIN users u ON TRY_CAST(al.user_id AS INT) = u.user_id
                LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
                WHERE al.table_name = 'Cases'
                  AND TRY_CAST(al.record_id AS INT) IS NOT NULL
                  AND c.org_id = ?
                  AND c.deleted_at IS NULL
                  AND (c.created_by_user_id = ? OR ca.user_id = ?)
                ORDER BY al.timestamp DESC
            """, (org_id, agent_id, agent_id))
            audit_rows = cursor.fetchall()
            audit_cols = [col[0] for col in cursor.description]
            activity += [dict(zip(audit_cols, row)) for row in audit_rows]
        except pyodbc.Error:
            pass  # audit_logs may not be populated or accessible

        activity.sort(key=lambda x: x.get("timestamp") or "", reverse=True)

        return {"message": "Success", "activity": activity[:20]}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_agent_assignments(agent_id: int, org_id: int):
    """
    Recent case assignments to/from this agent.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT TOP 10
                ca.assignment_id,
                ca.case_id,
                c.title                                        AS case_title,
                c.CaseNumber,
                c.status                                       AS case_status,
                CAST(ca.assigned_at AS NVARCHAR(50))          AS assigned_at,
                COALESCE(u.first_name + ' ' + u.last_name, 'System') AS assigned_by_name
            FROM case_assignments ca
            JOIN Cases c ON ca.case_id  = c.case_id
            LEFT JOIN users u ON ca.assigned_by = u.user_id
            WHERE ca.user_id     = ?
              AND c.org_id       = ?
              AND c.deleted_at  IS NULL
            ORDER BY ca.assigned_at DESC
        """, (agent_id, org_id))

        rows = cursor.fetchall()
        cols = [col[0] for col in cursor.description]
        assignments = [dict(zip(cols, row)) for row in rows]

        return {"message": "Success", "assignments": assignments}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()
