<<<<<<< HEAD
﻿from dotenv import load_dotenv
from ..database import get_db_connection
=======
from dotenv import load_dotenv
from services.database import get_db_connection
>>>>>>> origin/main
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


def list_my_evidence(agent_id: int):
    """Returns all evidence on every case the agent created or is assigned to."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = """
            SELECT DISTINCT
                CAST(e.FileId AS NVARCHAR(36)) AS file_id,
                e.case_id,
                e.FileName        AS file_name,
                e.FileExtension   AS file_extension,
                e.ContentType     AS content_type,
                e.ChecksumSha256  AS checksum_sha256,
                e.metadata_json,
                e.upload_date,
                e.uploaded_by,
                e.processing_status
            FROM Evidence e
            JOIN Cases c ON e.case_id = c.case_id
            LEFT JOIN case_assignments ca ON c.case_id = ca.case_id
            WHERE c.deleted_at IS NULL
              AND (c.created_by_user_id = ? OR ca.user_id = ?)
            ORDER BY e.upload_date DESC
        """
        cursor.execute(query, (agent_id, agent_id))
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        evidence = [dict(zip(columns, row)) for row in rows]

        return {"message": "Success", "evidence": evidence}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def list_case_evidence(case_id: int, agent_id: int):
    """Returns all evidence on a specific case, only if the agent is on that case."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if not agent_is_on_case(cursor, case_id, agent_id):
            return {"message": "Case not found or access denied"}

        cursor.execute("""
            SELECT
                CAST(FileId AS NVARCHAR(36)) AS file_id,
                case_id,
                FileName        AS file_name,
                FileExtension   AS file_extension,
                ContentType     AS content_type,
                ChecksumSha256  AS checksum_sha256,
                metadata_json,
                upload_date,
                uploaded_by,
                processing_status
            FROM Evidence
            WHERE case_id = ?
            ORDER BY upload_date DESC
        """, (case_id,))

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        evidence = [dict(zip(columns, row)) for row in rows]

        return {"message": "Success", "evidence": evidence}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_evidence_file(file_id: str, agent_id: int):
    """Returns file binary + metadata for download. Agent must be on the case."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get case_id for this file first
        cursor.execute("SELECT case_id FROM Evidence WHERE FileId = ?", (file_id,))
        row = cursor.fetchone()
        if not row:
            return {"message": "Evidence not found"}

        case_id = row[0]
        if not agent_is_on_case(cursor, case_id, agent_id):
            return {"message": "Access denied"}

        cursor.execute("""
            SELECT FileData, FileName, ContentType
            FROM Evidence
            WHERE FileId = ?
        """, (file_id,))

        row = cursor.fetchone()
        if not row:
            return {"message": "Evidence not found"}

        return {
            "message": "Success",
            "file_data": row[0],
            "file_name": row[1],
            "content_type": row[2]
        }

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def confirm_evidence(file_id: str, agent_id: int):
    """Confirms a pending evidence upload. Agent must be on the case."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT case_id FROM Evidence WHERE FileId = ? AND processing_status = 'pending'", (file_id,))
        row = cursor.fetchone()
        if not row:
            return {"message": "Pending evidence not found"}

        case_id = row[0]
        if not agent_is_on_case(cursor, case_id, agent_id):
            return {"message": "Access denied"}

        cursor.execute("""
            UPDATE Evidence SET processing_status = 'confirmed'
            WHERE FileId = ?
        """, (file_id,))
        conn.commit()

        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def delete_my_evidence(file_id: str, agent_id: int):
    """Deletes any evidence the agent uploaded, regardless of status."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT case_id FROM Evidence WHERE FileId = ? AND uploaded_by = ?", (file_id, agent_id))
        row = cursor.fetchone()
        if not row:
            return {"message": "Evidence not found or access denied"}

        cursor.execute("DELETE FROM Evidence WHERE FileId = ?", (file_id,))
        conn.commit()
        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def cancel_evidence(file_id: str, agent_id: int):
    """Deletes a pending evidence upload. Agent must be on the case."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT case_id FROM Evidence WHERE FileId = ? AND processing_status = 'pending'", (file_id,))
        row = cursor.fetchone()
        if not row:
            return {"message": "Pending evidence not found"}

        case_id = row[0]
        if not agent_is_on_case(cursor, case_id, agent_id):
            return {"message": "Access denied"}

        cursor.execute("DELETE FROM Evidence WHERE FileId = ?", (file_id,))
        conn.commit()

        return {"message": "Success"}

    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()
<<<<<<< HEAD

=======
>>>>>>> origin/main
