from dotenv import load_dotenv
from database import get_db_connection
import pyodbc

load_dotenv()


def agent_is_on_case(cursor, case_id: int, agent_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 1 FROM Cases c
        LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
        WHERE c.case_id = ?
          AND c.deleted_at IS NULL
          AND (c.created_by_user_id = ? OR ca.user_id = ?)
    """, (case_id, agent_id, agent_id))
    return cursor.fetchone() is not None


def list_case_notes(case_id: int, agent_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if not agent_is_on_case(cursor, case_id, agent_id):
            return {"message": "Case not found or access denied"}

        cursor.execute("""
            SELECT
                cn.note_id,
                cn.content,
                cn.created_at,
                cn.updated_at,
                u.user_id       AS author_id,
                u.first_name    AS author_first_name,
                u.last_name     AS author_last_name
            FROM case_notes cn
            JOIN users u ON cn.created_by_user_id = u.user_id
            WHERE cn.case_id = ?
            ORDER BY cn.created_at ASC
            """, (case_id,))

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        notes = [dict(zip(columns, row)) for row in rows]

        return {
            "message": "Success", 
            "notes": notes
            }

    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }

    finally:
        cursor.close()
        conn.close()


def create_case_note(case_id: int, agent_id: int, content: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if not agent_is_on_case(cursor, case_id, agent_id):
            return {"message": "Case not found or access denied"}

        cursor.execute("""
            INSERT INTO case_notes (case_id, created_by_user_id, content)
            VALUES (?, ?, ?)
        """, (case_id, agent_id, content))
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


def update_my_note(note_id: int, agent_id: int, content: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE case_notes
            SET content = ?, updated_at = SYSDATETIMEOFFSET()
            WHERE note_id = ? AND created_by_user_id = ?
        """, (content, note_id, agent_id))

        if cursor.rowcount == 0:
            return {"message": "Note not found or access denied"}

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
