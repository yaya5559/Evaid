from dotenv import load_dotenv
from services.database import get_db_connection
import pyodbc

load_dotenv()


def list_case_assignments(case_id: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                ca.assignment_id,
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                ca.assigned_at,
                assigner.first_name AS assigned_by_first_name,
                assigner.last_name  AS assigned_by_last_name
            FROM case_assignments ca
            JOIN Cases c        ON ca.case_id    = c.case_id
            JOIN users u        ON ca.user_id    = u.user_id
            JOIN users assigner ON ca.assigned_by = assigner.user_id
            WHERE ca.case_id = ? AND c.org_id = ? AND c.deleted_at IS NULL
            ORDER BY ca.assigned_at ASC
        """, (case_id, org_id))

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        assignments = [dict(zip(columns, row)) for row in rows]

        return {
            "message": "Success", 
            "assignments": assignments
            }

    except pyodbc.Error as e:
        return {
            "message": "Error",
              "error": str(e)
              }
    finally:
        cursor.close()
        conn.close()


def assign_agent_to_case(case_id: int, user_id: int, assigned_by: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verify the case belongs to this org
        cursor.execute("""
            SELECT 1 FROM Cases WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL
        """, (case_id, org_id))
        if not cursor.fetchone():
            return {"message": "Case not found or access denied"}

        # Verify the agent belongs to this org
        cursor.execute("""
            SELECT 1 FROM users WHERE user_id = ? AND org_id = ? AND deleted_at IS NULL
        """, (user_id, org_id))
        if not cursor.fetchone():
            return {"message": "Agent not found or not in this organization"}

        cursor.execute("""
            INSERT INTO case_assignments (case_id, user_id, assigned_by)
            VALUES (?, ?, ?)
        """, (case_id, user_id, assigned_by))
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


def remove_agent_from_case(case_id: int, user_id: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT 1 FROM Cases WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL
        """, (case_id, org_id))
        if not cursor.fetchone():
            return {"message": "Case not found or access denied"}

        cursor.execute("""
            DELETE FROM case_assignments WHERE case_id = ? AND user_id = ?
        """, (case_id, user_id))

        if cursor.rowcount == 0:
            return {"message": "Assignment not found"}

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
