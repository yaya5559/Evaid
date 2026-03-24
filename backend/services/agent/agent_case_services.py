from dotenv import load_dotenv
from database import get_db_connection
import pyodbc
import time

load_dotenv()


def list_my_cases(agent_id: int, org_id: int):
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
                CAST(c.due_date   AS NVARCHAR(50)) AS due_date,
                CAST(c.created_at AS NVARCHAR(50)) AS created_at,
                CAST(c.closed_at  AS NVARCHAR(50)) AS closed_at
            FROM Cases c
            LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
            WHERE c.deleted_at IS NULL
              AND c.org_id = ?
              AND (c.created_by_user_id = ? OR ca.user_id = ?)
            ORDER BY created_at DESC
        """, (org_id, agent_id, agent_id))

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        cases = [dict(zip(columns, row)) for row in rows]

        return {"message": "Success", "cases": cases}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_my_case(case_id: int, agent_id: int, org_id: int):
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
                CAST(c.due_date   AS NVARCHAR(50)) AS due_date,
                CAST(c.created_at AS NVARCHAR(50)) AS created_at,
                CAST(c.closed_at  AS NVARCHAR(50)) AS closed_at,
                c.resolution,
                u.user_id       AS creator_id,
                u.first_name    AS creator_first_name,
                u.last_name     AS creator_last_name
            FROM Cases c
            JOIN users u ON c.created_by_user_id = u.user_id
            LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
            WHERE c.case_id = ?
              AND c.deleted_at IS NULL
              AND c.org_id = ?
              AND (c.created_by_user_id = ? OR ca.user_id = ?)
        """, (case_id, org_id, agent_id, agent_id))

        row = cursor.fetchone()
        if not row:
            return {"message": "Case not found or access denied"}

        case_cols = [col[0] for col in cursor.description]
        case_data = dict(zip(case_cols, row))

        # Notes
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

        note_rows = cursor.fetchall()
        note_cols = [col[0] for col in cursor.description]
        notes = [dict(zip(note_cols, r)) for r in note_rows]

        # Evidence (read-only, no binary)
        cursor.execute("""
            SELECT
                CAST(FileId AS NVARCHAR(36)) AS file_id,
                FileName        AS file_name,
                FileExtension   AS file_extension,
                ContentType     AS content_type,
                CAST(upload_date AS NVARCHAR(50)) AS upload_date,
                uploaded_by,
                processing_status
            FROM Evidence
            WHERE case_id = ?
            ORDER BY upload_date DESC
        """, (case_id,))

        evidence_rows = cursor.fetchall()
        evidence_cols = [col[0] for col in cursor.description]
        evidence = [dict(zip(evidence_cols, r)) for r in evidence_rows]

        return {
            "message": "Success",
            "case": case_data,
            "notes": notes,
            "evidence": evidence,
        }

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def update_my_case(case_id: int, agent_id: int, org_id: int, title: str = None, due_date: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    fields = []
    values = []

    if title is not None:
        fields.append("title = ?")
        values.append(title)
    if due_date is not None:
        fields.append("due_date = ?")
        values.append(due_date if due_date != '' else None)

    if not fields:
        return {"message": "No fields to update"}

    values += [case_id, org_id, agent_id, agent_id]

    try:
        cursor.execute(f"""
            UPDATE Cases
            SET {', '.join(fields)}, updated_at = SYSDATETIMEOFFSET()
            WHERE case_id = ?
              AND org_id = ?
              AND deleted_at IS NULL
              AND (created_by_user_id = ? OR case_id IN (
                  SELECT case_id FROM case_assignments WHERE user_id = ?
              ))
        """, values)

        if cursor.rowcount == 0:
            return {"message": "Case not found or access denied"}

        conn.commit()
        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def create_case(org_id: int, agent_id: int, title: str, description: str = None, priority: str = None, severity_level: str = None, due_date: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        case_number = f"CASE-{int(time.time() * 1000)}"
        cursor.execute("""
            INSERT INTO Cases
            (CaseNumber, org_id, created_by_user_id, title,
             description, status, priority, severity_level, due_date)
            VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?)
        """, (case_number, org_id, agent_id, title, description, priority, severity_level, due_date))
        conn.commit()
        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()
