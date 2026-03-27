from dotenv import load_dotenv
from services.database import get_db_connection
from models.cases import Case
import pyodbc
import time

load_dotenv()


def list_org_cases(org_id: int):
    """Returns all cases belonging to the org admin's organization."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
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
                u.first_name    AS created_by_first_name,
                u.last_name     AS created_by_last_name,
                u.email         AS created_by_email
            FROM Cases c
            JOIN users u ON c.created_by_user_id = u.user_id
            WHERE c.org_id = ? AND c.deleted_at IS NULL
            ORDER BY c.created_at DESC
            """, (org_id,))

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


def get_org_case(case_id: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Case info + creator
        cursor.execute("""
            SELECT
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
                u.last_name     AS creator_last_name,
                u.email         AS creator_email
            FROM Cases c
            JOIN users u ON c.created_by_user_id = u.user_id
            WHERE c.case_id = ? AND c.org_id = ? AND c.deleted_at IS NULL
        """, (case_id, org_id))

        case_row = cursor.fetchone()
        if not case_row:
            return {"message": "Case not found or access denied"}

        case_cols = [col[0] for col in cursor.description]
        case_data = dict(zip(case_cols, case_row))

        # Assigned agents
        cursor.execute("""
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                CAST(ca.assigned_at AS NVARCHAR(50)) AS assigned_at,
                assigner.first_name AS assigned_by_first_name,
                assigner.last_name  AS assigned_by_last_name
            FROM case_assignments ca
            JOIN users u        ON ca.user_id    = u.user_id
            JOIN users assigner ON ca.assigned_by = assigner.user_id
            WHERE ca.case_id = ?
            ORDER BY ca.assigned_at ASC
            """, (case_id,))

        agent_rows = cursor.fetchall()
        agent_cols = [col[0] for col in cursor.description]
        agents = [dict(zip(agent_cols, row)) for row in agent_rows]

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
        notes = [dict(zip(note_cols, row)) for row in note_rows]

        # Evidence (no binary data)
        cursor.execute("""
            SELECT
                CAST(FileId AS NVARCHAR(36)) AS file_id,
                FileName        AS file_name,
                FileExtension   AS file_extension,
                ContentType     AS content_type,
                CAST(upload_date AS NVARCHAR(50)) AS upload_date,
                uploaded_by,
                processing_status,
                metadata_json
            FROM Evidence
            WHERE case_id = ?
            ORDER BY upload_date DESC
            """, (case_id,))

        evidence_rows = cursor.fetchall()
        evidence_cols = [col[0] for col in cursor.description]
        evidence = [dict(zip(evidence_cols, row)) for row in evidence_rows]

        return {
            "message": "Success",
            "case": case_data,
            "assigned_agents": agents,
            "notes": notes,
            "evidence": evidence
        }

    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }

    finally:
        cursor.close()
        conn.close()


def create_case(org_id: int, data: Case):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        case_number = f"CASE-{int(time.time() * 1000)}"
        cursor.execute("""
            INSERT INTO Cases
            (CaseNumber, org_id, created_by_user_id, title,
             description, status, priority,
            severity_level, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            case_number,
            org_id,
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
        return {
            "message": "Error", 
            "error": str(e)
            }

    finally:
        cursor.close()
        conn.close()


def update_org_case(case_id: int, org_id: int, description: str = None, priority: str = None, severity_level: str = None, due_date: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    fields = []
    values = []

    if description is not None:
        fields.append("description = ?")
        values.append(description)
    if priority is not None:
        fields.append("priority = ?")
        values.append(priority)
    if severity_level is not None:
        fields.append("severity_level = ?")
        values.append(severity_level)
    if due_date is not None:
        fields.append("due_date = ?")
        values.append(due_date if due_date != '' else None)

    if not fields:
        return {"message": "No fields to update"}

    values += [case_id, org_id]

    try:
        cursor.execute(f"""
            UPDATE Cases
            SET {', '.join(fields)}, updated_at = SYSDATETIMEOFFSET()
            WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL
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


def close_org_case(case_id: int, org_id: int, closed_by_user_id: int, resolution: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE Cases
            SET status = 'Closed',
                closed_at = SYSDATETIMEOFFSET(),
                closed_by_user_id = ?,
                resolution = ?,
                updated_at = SYSDATETIMEOFFSET()
            WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL
            """, (closed_by_user_id, resolution, case_id, org_id))

        if cursor.rowcount == 0:
            return {"message": "Case not found or access denied"}

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


def delete_org_case(case_id: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE Cases
            SET deleted_at = SYSDATETIMEOFFSET()
            WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL
            """, (case_id, org_id))

        if cursor.rowcount == 0:
            return {"message": "Case not found or access denied"}

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
