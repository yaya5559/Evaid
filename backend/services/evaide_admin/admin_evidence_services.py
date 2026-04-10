from dotenv import load_dotenv
from services.database import get_db_connection
from models.cases import Case
import pyodbc

load_dotenv()

def list_all_evidence():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # SELECT FileId, FileName, case_id, ContentType, upload_date, processing_status
        # FROM Evidence -- no org filter
        cursor.execute("""
            SELECT CAST(FileId AS NVARCHAR(36)) AS file_id, FileName, case_id,
                ContentType, CAST(upload_date AS NVARCHAR(50)) AS upload_date, processing_status
            FROM Evidence
            ORDER BY upload_date DESC
        """)
        rows = cursor.fetchall()
        cols = [col[0] for col in cursor.description]
        evidence = [dict(zip(cols, row)) for row in rows]
        return {"message": "Success", "evidence": evidence}
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()

def list_case_evidence(case_id: int):
    """Returns all evidence on a specific case. No org boundary."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                CAST(FileId AS NVARCHAR(36)) AS file_id,
                case_id,
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

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        evidence = [dict(zip(columns, row)) for row in rows]

        return {"message": "Success", "evidence": evidence}

    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_evidence(file_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # SELECT * FROM Evidence WHERE FileId = ?
        cursor.execute("""
            SELECT
                CAST(FileId AS NVARCHAR(36)) AS file_id,
                case_id,
                FileName        AS file_name,
                FileExtension   AS file_extension,
                ContentType     AS content_type,
                CAST(upload_date AS NVARCHAR(50)) AS upload_date,
                uploaded_by,
                processing_status,
                metadata_json
            FROM Evidence
            WHERE FileId = ?
        """, (file_id,))
        row = cursor.fetchone()
        if row is None:
            return {"message": "Error", "error": "Evidence not found"}
        cols = [col[0] for col in cursor.description]
        evidence = dict(zip(cols, row))
        return {"message": "Success", "evidence": evidence}
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def delete_evidence(file_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # DELETE FROM Evidence WHERE FileId = ?
        cursor.execute("DELETE FROM Evidence WHERE FileId = ?", (file_id,))
        # if nothing got deleted the id prob doesnt exist
        if cursor.rowcount == 0:
            return {"message": "Error", "error": "Evidence not found"}
        conn.commit()
        return {"message": "Success", "deleted_file_id": file_id}
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()
