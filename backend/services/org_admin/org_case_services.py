from dotenv import load_dotenv
from database import get_db_connection
from models.cases import Case
import pyodbc

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
                c.due_date,
                c.created_at,
                c.closed_at,
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

        return {"message": "Success", "cases": cases}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_org_case(case_id: int, org_id: int):
    """Returns a single case with full detail — agents, notes, evidence.
    Enforces org boundary so admins cannot access cases outside their org."""
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
                c.due_date,
                c.created_at,
                c.closed_at,
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
                ca.assigned_at,
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
                upload_date,
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
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def create_case(org_id: int, data: Case):
    """Creates a new case scoped to the org admin's organization."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Cases (org_id, created_by_user_id, title, description, status, priority, severity_level, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
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
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def close_org_case(case_id: int, org_id: int, closed_by_user_id: int, resolution: str):
    """Closes a case within the org admin's organization."""
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
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def delete_org_case(case_id: int, org_id: int):
    """Soft-deletes a case within the org admin's organization."""
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
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()
