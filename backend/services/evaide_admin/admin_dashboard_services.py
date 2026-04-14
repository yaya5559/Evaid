#Abenezer
from dotenv import load_dotenv
from services.database import get_db_connection
import pyodbc

load_dotenv()


def get_admin_dashboard_kpis():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT COUNT(*) FROM users WHERE role_id = 3 AND deleted_at IS NULL"
        )
        agent_row = cursor.fetchone()
        total_agents = agent_row[0] if agent_row else 0

        cursor.execute(
            "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"
        )
        employee_row = cursor.fetchone()
        total_employees = employee_row[0] if employee_row else 0

        cursor.execute(
            "SELECT COUNT(*) FROM Cases WHERE deleted_at IS NULL"
        )
        cases_row = cursor.fetchone()
        active_cases = cases_row[0] if cases_row else 0

        return [
            {
                "label": "Total agents",
                "value": str(total_agents),
                "delta": "+0",
                "tone": "neutral",
            },
            {
                "label": "Total employees",
                "value": str(total_employees),
                "delta": "+0",
                "tone": "neutral",
            },
            {
                "label": "Active cases",
                "value": str(active_cases),
                "delta": "+0",
                "tone": "neutral",
            },
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
        cursor.execute(
            "SELECT status, COUNT(*) FROM Cases WHERE deleted_at IS NULL GROUP BY status"
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
                "ratio": ratio(status_counts.get("Open", 0)),
            },
            {
                "stage": "Review",
                "total": status_counts.get("Pending", 0),
                "ratio": ratio(status_counts.get("Pending", 0)),
            },
            {
                "stage": "Resolution",
                "total": status_counts.get("Closed", 0),
                "ratio": ratio(status_counts.get("Closed", 0)),
            },
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
