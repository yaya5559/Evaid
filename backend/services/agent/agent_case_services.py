from dotenv import load_dotenv
from database import get_db_connection
from models.cases import Case
import pyodbc

load_dotenv()


def list_my_cases(agent_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = """
            SELECT DISTINCT
                c.case_id,
                c.CaseNumber,
                c.title,
                c.description,
                c.status,
                c.priority,
                c.severity_level,
                c.due_date,
                c.created_at,
                c.closed_at
            FROM Cases c
            LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
            WHERE c.deleted_at IS NULL
              AND (c.created_by_user_id = ? OR ca.user_id = ?)
            ORDER BY c.created_at DESC
        """
        cursor.execute(query, (agent_id, agent_id))
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        cases = [dict(zip(columns, row)) for row in rows]

        return {
            "message": "Success", 
            "cases": cases
            }

    except pyodbc.Error as e:
        return {
            "message": "Error",
              "error": str(e)
              }
    finally:
        cursor.close()
        conn.close()


def get_my_case(case_id: int, agent_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT DISTINCT
                c.case_id,
                c.CaseNumber,
                c.title,
                c.description,
                c.status,
                c.priority,
                c.severity_level,
                c.due_date,
                c.created_at,
                c.closed_at,
                c.resolution
            FROM Cases c
            LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
            WHERE c.case_id = ?
              AND c.deleted_at IS NULL
              AND (c.created_by_user_id = ? OR ca.user_id = ?)
            """, (case_id, agent_id, agent_id))
        row = cursor.fetchone()
        columns = [column[0] for column in cursor.description]
        case = dict(zip(columns, row))

        if not row:
            return {"message": "Case not found or access denied"}

        columns = [col[0] for col in cursor.description]
        return {
            "message": "Success", 
            "case": case
            }

    except pyodbc.Error as e:
        return {
            "message": "Error",
              "error": str(e)
              }

    finally:
        cursor.close()
        conn.close()


def create_case(data: Case, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = """
            INSERT INTO Cases 
            (org_id, created_by_user_id, title, 
            description, status, priority, severity_level, 
            due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(query, (
            data.org_id,
            data.created_by_user_id,
            data.title,
            data.description,
            data.status,
            data.priority,
            data.severity_level,
            data.due_date
        ))
        conn.commit()
        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()
