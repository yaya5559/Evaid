from dotenv import load_dotenv
from services.database import get_db_connection
import pyodbc

load_dotenv()


def list_org_agents(org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                u.is_enabled,
                u.is_profile_complete,
                u.last_login_at,
                u.created_at
            FROM users u
            WHERE u.org_id = ? AND u.role_id = 3 AND u.deleted_at IS NULL
            ORDER BY u.last_name ASC
            """, (org_id,))

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        agents = [dict(zip(columns, row)) for row in rows]

        return {
            "message": "Success", 
            "agents": agents
            }

    except pyodbc.Error as e:
        return {
            "message": "Error",
            "error": str(e)
            }

    finally:
        cursor.close()
        conn.close()


def get_org_agent(user_id: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                u.is_enabled,
                u.is_profile_complete,
                u.last_login_at,
                u.created_at
            FROM users u
            WHERE u.user_id = ? AND u.org_id = ? AND u.deleted_at IS NULL
            """, (user_id, org_id))

        row = cursor.fetchone()
        if not row:
            return {"message": "Agent not found or access denied"}

        columns = [col[0] for col in cursor.description]
        agent = dict(zip(columns, row))
        return {
            "message": "Success", 
            "agent": agent
            }

    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }

    finally:
        cursor.close()
        conn.close()


def enable_org_agent(user_id: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE users 
            SET is_enabled = 1
            WHERE user_id = ? AND org_id = ? AND deleted_at IS NULL
            """, (user_id, org_id))

        if cursor.rowcount == 0:
            return {"message": "Agent not found or access denied"}

        conn.commit()
        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {
            "message": "Error", 
            "error": str(e)
            }

    finally:
        cursor.close()
        conn.close()


def disable_org_agent(user_id: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE users 
            SET is_enabled = 0
            WHERE user_id = ? AND org_id = ? AND deleted_at IS NULL
            """, (user_id, org_id))

        if cursor.rowcount == 0:
            return {"message": "Agent not found or access denied"}

        conn.commit()
        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {
            "message": "Error", 
            "error": str(e)
            }

    finally:
        cursor.close()
        conn.close()

