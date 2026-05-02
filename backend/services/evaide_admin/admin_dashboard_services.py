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
        cursor.execute(
            "SELECT TOP 5 cn.content, c.title, CAST(cn.created_at AS NVARCHAR(50)) AS created_at "
            "FROM case_notes cn "
            "JOIN Cases c ON cn.case_id = c.case_id "
            "WHERE cn.deleted_at IS NULL "
            "ORDER BY cn.created_at DESC"
        )
        rows = cursor.fetchall()
        return [f"{row[2]} - {row[1]}: {row[0]}" for row in rows]

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
