from dotenv import load_dotenv
from services.database import get_db_connection
import pyodbc

load_dotenv()


def get_org_dashboard_summary(org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get organization creation date
        cursor.execute("""
            SELECT CONVERT(NVARCHAR(50), created_at, 127), name, email
            FROM organizations
            WHERE org_id = ? AND deleted_at IS NULL
        """, (org_id,))
        org_row = cursor.fetchone()

        if not org_row:
            return {"message": "Organization not found"}


        # Count total agents (role_id = 3)
        cursor.execute("""
            SELECT COUNT(*) as agent_count
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.org_id = ? AND UPPER(r.role_name) = 'AGENT'
              AND u.deleted_at IS NULL AND u.is_enabled = 1

        """, (org_id,))
        agent_row = cursor.fetchone()
        agent_count = agent_row[0] if agent_row else 0
        # Count total employees (all active users in org)
        cursor.execute("""
            SELECT COUNT(*) as employee_count
            FROM users
            WHERE org_id = ? AND deleted_at IS NULL
        """, (org_id,))
        employee_row = cursor.fetchone()
        employee_count = employee_row[0] if employee_row else 0

        return {
            "message": "Success",
            "organization": {
                "name": org_row[1],
                "email": org_row[2],
                "created_at": str(org_row[0]) if org_row[0] else None,
                "total_agents": agent_count,
                "total_employees": employee_count
            }
        }

    except pyodbc.Error as e:
        return {
        cursor.close()
        conn.close()


def get_org_dashboard_kpis(org_id: int):
    summary = get_org_dashboard_summary(org_id)
    if summary.get("message") != "Success":
        return {"message": "Error", "error": "Unable to load dashboard summary"}

    org = summary["organization"]
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT COUNT(*) FROM Cases WHERE org_id = ? AND deleted_at IS NULL",
            (org_id,)
        )
        row = cursor.fetchone()
        cases_count = row[0] if row else 0

        return [
            {
                "label": "Total agents",
                "value": str(org.get("total_agents", 0)),
                "delta": "+0",
                "tone": "neutral"
            },
            {
                "label": "Total employees",
                "value": str(org.get("total_employees", 0)),
                "delta": "+0",
                "tone": "neutral"
            },
            {
                "label": "Active cases",
                "value": str(cases_count),
                "delta": "+0",
                "tone": "neutral"
            }
        ]

    except pyodbc.Error as e:
        return {
            "message": "Error",
            "error": str(e)
        }

    finally:
        cursor.close()
        conn.close()


def get_org_dashboard_pipeline(org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT status, COUNT(*) FROM Cases WHERE org_id = ? AND deleted_at IS NULL GROUP BY status",
            (org_id,)
        )
        rows = cursor.fetchall()
        status_counts = {row[0]: row[1] for row in rows}
        total = sum(status_counts.values())

        def ratio(count: int) -> float:
            return round((count / total) * 100, 1) if total else 0.0

        return [
            {
                "stage": "Intake",
                "total": status_counts.get("Open", 0),
                "ratio": ratio(status_counts.get("Open", 0))
            },
            {
                "stage": "Review",
                "total": status_counts.get("Pending", 0),
                "ratio": ratio(status_counts.get("Pending", 0))
            },
            {
                "stage": "Resolution",
                "total": status_counts.get("Closed", 0),
                "ratio": ratio(status_counts.get("Closed", 0))
            }
        ]

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_org_dashboard_activity(org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT TOP 5 cn.content, c.title, CAST(cn.created_at AS NVARCHAR(50)) AS created_at "
            "FROM case_notes cn "
            "JOIN Cases c ON cn.case_id = c.case_id "
            "WHERE c.org_id = ? AND cn.deleted_at IS NULL "
            "ORDER BY cn.created_at DESC",
            (org_id,)
        )
        rows = cursor.fetchall()
        return [f"{row[2]} - {row[1]}: {row[0]}" for row in rows]

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()