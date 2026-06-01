from dotenv import load_dotenv
from fastapi import HTTPException
from services.database import get_db_connection
import pyodbc

load_dotenv()

def list_case_notes(case_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                cn.note_id,
                cn.content,
                CAST(cn.created_at AS NVARCHAR(50)) AS created_at,
                CAST(cn.updated_at AS NVARCHAR(50)) AS updated_at,
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


def create_note(case_id: int, content: str, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO case_notes (case_id, content, created_by_user_id, created_at, updated_at)
            VALUES (?, ?, ?, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET())
        """, (case_id, content, user_id))
        conn.commit()
        return {"message": "Note created successfully"}
    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def update_note(note_id: int, content: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE case_notes
            SET content = ?, updated_at = SYSDATETIMEOFFSET()
            WHERE note_id = ?
        """, (content, note_id))

        if cursor.rowcount == 0:
            return {"message": "Note not found"}

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


def delete_note(note_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM case_notes WHERE note_id = ?", (note_id,))

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404)

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
