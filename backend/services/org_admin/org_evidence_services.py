<<<<<<< HEAD
﻿from dotenv import load_dotenv
=======
from dotenv import load_dotenv
>>>>>>> origin/main
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


def list_org_evidence(org_id: int):
    """Returns all evidence across every case in the organization."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                CAST(e.FileId AS NVARCHAR(36)) AS file_id,
                e.case_id,
                c.title             AS case_title,
                e.FileName          AS file_name,
                e.FileExtension     AS file_extension,
                e.ContentType       AS content_type,
                e.ChecksumSha256    AS checksum_sha256,
                e.metadata_json,
                e.upload_date,
                e.uploaded_by,
                e.processing_status
            FROM Evidence e
            JOIN Cases c ON e.case_id = c.case_id
            WHERE c.org_id = ? AND c.deleted_at IS NULL
            ORDER BY e.upload_date DESC
        """, (org_id,))

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        evidence = [dict(zip(columns, row)) for row in rows]

        return {"message": "Success", "evidence": evidence}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def list_case_evidence(case_id: int, org_id: int):
    """Returns all evidence on a specific case within the organization."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if not _case_belongs_to_org(cursor, case_id, org_id):
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


def get_evidence_file(file_id: str, org_id: int):
    """Returns file binary + metadata for download. Must belong to an org case."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT case_id FROM Evidence WHERE FileId = ?", (file_id,))
        row = cursor.fetchone()
        if not row:
            return {"message": "Evidence not found"}

        if not _case_belongs_to_org(cursor, row[0], org_id):
            return {"message": "Access denied"}

        cursor.execute("""
            SELECT FileData, FileName, ContentType
            FROM Evidence WHERE FileId = ?
        """, (file_id,))

        row = cursor.fetchone()
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


def delete_evidence(file_id: str, org_id: int):
    """Deletes an evidence file. Must belong to an org case."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT case_id FROM Evidence WHERE FileId = ?", (file_id,))
        row = cursor.fetchone()
        if not row:
            return {"message": "Evidence not found"}

        if not _case_belongs_to_org(cursor, row[0], org_id):
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
