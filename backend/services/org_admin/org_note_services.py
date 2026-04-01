from dotenv import load_dotenv
from services.database import get_db_connection
import pyodbc

load_dotenv()


def _case_belongs_to_org(cursor, case_id: int, org_id: int) -> bool:
    """Returns True if the case belongs to the organization."""
    cursor.execute("""
        SELECT 1 FROM Cases
        WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL
    """, (case_id, org_id))
    return cursor.fetchone() is not None


def list_case_notes(case_id: int, org_id: int):
    """Returns all notes on a case within the organization."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if not _case_belongs_to_org(cursor, case_id, org_id):
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

        return {"message": "Success", "notes": notes}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def create_case_note(case_id: int, org_id: int, created_by_user_id: int, content: str):
    """Adds a note to a case within the organization."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if not _case_belongs_to_org(cursor, case_id, org_id):
            return {"message": "Case not found or access denied"}

        cursor.execute("""
            INSERT INTO case_notes (case_id, created_by_user_id, content)
            VALUES (?, ?, ?)
        """, (case_id, created_by_user_id, content))
        conn.commit()

        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def update_note(note_id: int, org_id: int, content: str):
    """Updates any note on an org case. Org admins can edit any note, not just their own."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verify the note belongs to a case in this org before updating
        cursor.execute("""
            SELECT 1 FROM case_notes cn
            JOIN Cases c ON cn.case_id = c.case_id
            WHERE cn.note_id = ? AND c.org_id = ? AND c.deleted_at IS NULL
        """, (note_id, org_id))

        if not cursor.fetchone():
            return {"message": "Note not found or access denied"}

        cursor.execute("""
            UPDATE case_notes
            SET content = ?, updated_at = SYSDATETIMEOFFSET()
            WHERE note_id = ?
        """, (content, note_id))
        conn.commit()

        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def delete_note(note_id: int, org_id: int):
    """Deletes any note on an org case."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT 1 FROM case_notes cn
            JOIN Cases c ON cn.case_id = c.case_id
            WHERE cn.note_id = ? AND c.org_id = ? AND c.deleted_at IS NULL
        """, (note_id, org_id))

        if not cursor.fetchone():
            return {"message": "Note not found or access denied"}

        cursor.execute("DELETE FROM case_notes WHERE note_id = ?", (note_id,))
        conn.commit()

        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()

