from dotenv import load_dotenv
from database import get_db_connection
import pyodbc

load_dotenv()


def _agent_is_on_case(cursor, case_id: int, agent_id: int) -> bool:
    cursor.execute("""
        SELECT 1 FROM Cases c
        LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
        WHERE c.case_id = ?
          AND c.deleted_at IS NULL
          AND (c.created_by_user_id = ? OR ca.user_id = ?)
    """, (case_id, agent_id, agent_id))
    return cursor.fetchone() is not None


def create_case_note(case_id: int, agent_id: int, content: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if not _agent_is_on_case(cursor, case_id, agent_id):
            return {"message": "Case not found or access denied"}

        cursor.execute("""
            INSERT INTO case_notes (case_id, created_by_user_id, content)
            VALUES (?, ?, ?)
        """, (case_id, agent_id, content))
        conn.commit()
        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

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
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()
