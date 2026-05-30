#Abenezer
from dotenv import load_dotenv
from services.database import get_db_connection
import pyodbc

load_dotenv()


def get_admin_dashboard_kpis():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT COUNT(*) FROM users WHERE role_id = 1 AND deleted_at IS NULL")
        evaide_admin_count = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM users WHERE role_id = 2 AND deleted_at IS NULL")
        org_owner_count = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM users WHERE role_id = 3 AND deleted_at IS NULL")
        agent_count = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL")
        total_users = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM Evidence")
        total_evidence = cursor.fetchone()[0] or 0

        cursor.execute("""
            SELECT
              COALESCE((SELECT SUM(DATALENGTH(file_bytes)) FROM Attachment), 0) +
              COALESCE((SELECT SUM(DATALENGTH(FileData)) FROM Evidence), 0)
        """)
        total_bytes = cursor.fetchone()[0] or 0

        def format_bytes(b: int) -> str:
            if b >= 1_073_741_824:
                return f"{b / 1_073_741_824:.1f} GB"
            if b >= 1_048_576:
                return f"{b / 1_048_576:.1f} MB"
            if b >= 1_024:
                return f"{b / 1_024:.1f} KB"
            return f"{b} B"

        return [
            {"label": "Evaide Admin Total", "value": str(evaide_admin_count), "delta": "", "tone": "neutral"},
            {"label": "Organization Owner Total", "value": str(org_owner_count), "delta": "", "tone": "neutral"},
            {"label": "Agent Total", "value": str(agent_count), "delta": "", "tone": "neutral"},
            {"label": "Total Users", "value": str(total_users), "delta": "", "tone": "neutral"},
            {"label": "Total Evidence", "value": str(total_evidence), "delta": "", "tone": "neutral"},
            {"label": "Storage Used", "value": format_bytes(total_bytes), "delta": "", "tone": "neutral"},
        ]

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_admin_dashboard_pipeline():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL AND is_active = 1")
        total_orgs = cursor.fetchone()[0] or 0

        cursor.execute(
            "SELECT COUNT(*) FROM organizations WHERE owner_id IS NOT NULL AND deleted_at IS NULL AND is_active = 1"
        )
        owner_added = cursor.fetchone()[0] or 0

        cursor.execute("""
            SELECT COUNT(DISTINCT o.org_id)
            FROM organizations o
            WHERE o.deleted_at IS NULL AND o.is_active = 1
              AND EXISTS (
                SELECT 1 FROM users u
                WHERE u.org_id = o.org_id AND u.role_id = 3 AND u.deleted_at IS NULL
              )
        """)
        agents_added = cursor.fetchone()[0] or 0

        cursor.execute("""
            SELECT COUNT(DISTINCT o.org_id)
            FROM organizations o
            WHERE o.deleted_at IS NULL AND o.is_active = 1
              AND EXISTS (
                SELECT 1 FROM Cases c
                WHERE c.org_id = o.org_id AND c.deleted_at IS NULL
              )
        """)
        first_case = cursor.fetchone()[0] or 0

        def ratio(count: int) -> float:
            return round((count / total_orgs) * 100, 1) if total_orgs else 0.0

        return [
            {"stage": "Organization Created", "total": total_orgs, "ratio": 100.0},
            {"stage": "Owner Registered", "total": owner_added, "ratio": ratio(owner_added)},
            {"stage": "Agents Registered", "total": agents_added, "ratio": ratio(agents_added)},
            {"stage": "First Case Opened", "total": first_case, "ratio": ratio(first_case)},
        ]

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_admin_dashboard_activity():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT TOP 50 event_type, label, actor, org_name, timestamp
            FROM (
                SELECT
                    'note_added'                                              AS event_type,
                    'Note on "' + ISNULL(c.title, 'Untitled') + '"'         AS label,
                    u.first_name + ' ' + u.last_name                         AS actor,
                    COALESCE(o.name, 'N/A')                                  AS org_name,
                    CAST(cn.created_at AS NVARCHAR(50))                      AS timestamp
                FROM case_notes cn
                JOIN Cases c      ON cn.case_id            = c.case_id
                JOIN users u      ON cn.created_by_user_id = u.user_id
                LEFT JOIN organizations o ON c.org_id      = o.org_id
                WHERE c.deleted_at IS NULL

                UNION ALL

                SELECT
                    'case_opened',
                    'Case opened: "' + ISNULL(c.title, 'Untitled') + '"',
                    u.first_name + ' ' + u.last_name,
                    COALESCE(o.name, 'N/A'),
                    CAST(c.created_at AS NVARCHAR(50))
                FROM Cases c
                JOIN users u      ON c.created_by_user_id  = u.user_id
                LEFT JOIN organizations o ON c.org_id      = o.org_id
                WHERE c.deleted_at IS NULL

                UNION ALL

                SELECT
                    'case_closed',
                    'Case closed: "' + ISNULL(c.title, 'Untitled') + '"',
                    u.first_name + ' ' + u.last_name,
                    COALESCE(o.name, 'N/A'),
                    CAST(c.closed_at AS NVARCHAR(50))
                FROM Cases c
                JOIN users u      ON c.closed_by_user_id   = u.user_id
                LEFT JOIN organizations o ON c.org_id      = o.org_id
                WHERE c.closed_at IS NOT NULL AND c.deleted_at IS NULL

                UNION ALL

                SELECT
                    'agent_assigned',
                    ua.first_name + ' ' + ua.last_name + ' assigned to "' + ISNULL(c.title, 'Untitled') + '"',
                    ub.first_name + ' ' + ub.last_name,
                    COALESCE(o.name, 'N/A'),
                    CAST(ca.assigned_at AS NVARCHAR(50))
                FROM case_assignments ca
                JOIN Cases c        ON ca.case_id    = c.case_id
                JOIN users ua       ON ca.user_id    = ua.user_id
                JOIN users ub       ON ca.assigned_by = ub.user_id
                LEFT JOIN organizations o ON c.org_id = o.org_id
                WHERE c.deleted_at IS NULL

                UNION ALL

                SELECT
                    'user_registered',
                    u.first_name + ' ' + u.last_name + ' registered (' + r.role_name + ')',
                    'System',
                    COALESCE(o.name, 'N/A'),
                    CAST(u.created_at AS NVARCHAR(50))
                FROM users u
                JOIN roles r ON r.role_id = u.role_id
                LEFT JOIN organizations o ON o.org_id = u.org_id
                WHERE u.deleted_at IS NULL

                UNION ALL

                SELECT
                    'org_created',
                    'Organization "' + o.name + '" created',
                    COALESCE(u.first_name + ' ' + u.last_name, 'System'),
                    o.name,
                    CAST(o.created_at AS NVARCHAR(50))
                FROM organizations o
                LEFT JOIN users u ON o.owner_id = u.user_id
                WHERE o.deleted_at IS NULL

                UNION ALL

                SELECT
                    'org_archived',
                    'Organization "' + o.name + '" archived',
                    'System',
                    o.name,
                    CAST(o.deleted_at AS NVARCHAR(50))
                FROM organizations o
                WHERE o.deleted_at IS NOT NULL

                UNION ALL

                SELECT
                    'note_edited',
                    'Note edited on "' + ISNULL(c.title, 'Untitled') + '"',
                    u.first_name + ' ' + u.last_name,
                    COALESCE(o.name, 'N/A'),
                    CAST(cn.updated_at AS NVARCHAR(50))
                FROM case_notes cn
                JOIN Cases c      ON cn.case_id            = c.case_id
                JOIN users u      ON cn.created_by_user_id = u.user_id
                LEFT JOIN organizations o ON c.org_id      = o.org_id
                WHERE cn.updated_at > cn.created_at AND c.deleted_at IS NULL

                UNION ALL

                SELECT
                    'evidence_uploaded',
                    'Evidence "' + ISNULL(e.title, 'Untitled') + '" uploaded',
                    e.uploaded_by,
                    COALESCE(o.name, 'N/A'),
                    CAST(e.created_at AS NVARCHAR(50))
                FROM Evidence e
                LEFT JOIN Cases c ON e.case_id = c.case_id
                LEFT JOIN organizations o ON c.org_id = o.org_id

                UNION ALL

                SELECT
                    'evidence_added',
                    'Evidence "' + ISNULL(ei.title, 'Untitled') + '" added',
                    u.first_name + ' ' + u.last_name,
                    'N/A',
                    CAST(ei.created_at AS NVARCHAR(50))
                FROM EvidenceItem ei
                JOIN users u ON ei.created_by_user_id = u.user_id

                UNION ALL

                SELECT
                    'analysis_completed',
                    'Analysis completed on "' + ISNULL(ei.title, 'Untitled') + '"',
                    'System',
                    'N/A',
                    CAST(ar.finished_at AS NVARCHAR(50))
                FROM AnalysisRun ar
                JOIN EvidenceItem ei ON ar.evidence_id = ei.Id
                WHERE ar.finished_at IS NOT NULL

                UNION ALL

                SELECT
                    'ai_suggestion',
                    'AI suggestion generated for "' + ISNULL(c.title, 'Untitled') + '"',
                    'AI',
                    COALESCE(o.name, 'N/A'),
                    CAST(a.created_at AS NVARCHAR(50))
                FROM ai_suggestions a
                JOIN Cases c ON a.case_id = c.case_id
                LEFT JOIN organizations o ON c.org_id = o.org_id
                WHERE c.deleted_at IS NULL

                UNION ALL

                SELECT
                    'ai_suggestion_reviewed',
                    'AI suggestion ' + LOWER(a.status) + ' for "' + ISNULL(c.title, 'Untitled') + '"',
                    u.first_name + ' ' + u.last_name,
                    COALESCE(o.name, 'N/A'),
                    CAST(a.reviewed_at AS NVARCHAR(50))
                FROM ai_suggestions a
                JOIN Cases c      ON a.case_id              = c.case_id
                JOIN users u      ON a.reviewed_by_user_id  = u.user_id
                LEFT JOIN organizations o ON c.org_id       = o.org_id
                WHERE a.reviewed_at IS NOT NULL AND c.deleted_at IS NULL

                UNION ALL

                SELECT
                    'signal_triaged',
                    'Signal ' + ps.triage_status + ': "' + ps.signal_type + '"',
                    u.first_name + ' ' + u.last_name,
                    'N/A',
                    CAST(ps.reviewed_at AS NVARCHAR(50))
                FROM PendingSignal ps
                JOIN users u ON ps.reviewed_by = u.user_id
                WHERE ps.reviewed_at IS NOT NULL AND ps.reviewed_by IS NOT NULL

                UNION ALL

                SELECT
                    'user_deactivated',
                    u.first_name + ' ' + u.last_name + ' deactivated (' + r.role_name + ')',
                    'System',
                    COALESCE(o.name, 'N/A'),
                    CAST(u.deleted_at AS NVARCHAR(50))
                FROM users u
                JOIN roles r ON r.role_id = u.role_id
                LEFT JOIN organizations o ON o.org_id = u.org_id
                WHERE u.deleted_at IS NOT NULL

                UNION ALL

                SELECT
                    'evidence_linked',
                    'Evidence connection made',
                    el.created_by,
                    'N/A',
                    CAST(el.created_at AS NVARCHAR(50))
                FROM EvidenceLink el

                UNION ALL

                SELECT
                    'entity_cluster',
                    'Entity cluster identified: "' + ISNULL(ec.label, 'Unknown') + '" (' + ec.cluster_type + ')',
                    ec.created_by,
                    'N/A',
                    CAST(ec.created_at AS NVARCHAR(50))
                FROM EntityCluster ec
            ) AS activity
            ORDER BY timestamp DESC
        """)
        rows = cursor.fetchall()
        return [
            {
                "event_type": row[0],
                "label": row[1],
                "actor": row[2],
                "org_name": row[3],
                "timestamp": row[4],
            }
            for row in rows
        ]

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_admin_dashboard_last_logins():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT TOP 20
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                r.role_name,
                COALESCE(o.name, 'N/A') AS org_name,
                CAST(u.last_login_at AS NVARCHAR(50)) AS last_login_at
            FROM users u
            JOIN roles r ON r.role_id = u.role_id
            LEFT JOIN organizations o ON o.org_id = u.org_id
            WHERE u.last_login_at IS NOT NULL
              AND u.deleted_at IS NULL
            ORDER BY u.last_login_at DESC
        """)
        rows = cursor.fetchall()
        return [
            {
                "user_id": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "email": row[3],
                "role": row[4],
                "org_name": row[5],
                "last_login_at": row[6],
            }
            for row in rows
        ]

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()
