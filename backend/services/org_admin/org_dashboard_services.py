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
            SELECT created_at, name, email
            FROM organizations
            WHERE org_id = ? AND deleted_at IS NULL
        """, (org_id,))
        org_row = cursor.fetchone()

        if not org_row:
            return {"message": "Organization not found"}

        # Count total agents (role_id = 3)
        cursor.execute("""
            SELECT COUNT(*) as agent_count
            FROM users
            WHERE org_id = ? AND role_id = 3 AND deleted_at IS NULL
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
                "created_at": org_row[0].isoformat() if org_row[0] else None,
                "total_agents": agent_count,
                "total_employees": employee_count
            }
        }

    except pyodbc.Error as e:
        return {
            "message": "Error",
            "error": str(e)
        }

    finally:
        cursor.close()
        conn.close()