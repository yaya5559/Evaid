from dotenv import load_dotenv
from database import get_db_connection
from models.cases import Case
import pyodbc

load_dotenv()

def list_all_cases():
  conn = get_db_connection()
  cursor = conn.cursor()

  try: 
    query = "SELECT * FROM cases"
    cursor.execute(query,)
    rows = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
    cases = [dict(zip(columns, row)) for row in rows]

    return {
      "Message": "Success",
      "Cases": cases
    }
  
  except pyodbc.Error as e:
    print(f"Database error: {e}")
    return "Failed"
  
  finally:
    conn.close()

def list_org_cases(org: int):
  conn = get_db_connection()
  cursor = conn.cursor()

  try: 
    query = "SELECT * FROM cases WHERE org_id = ?"
    cursor.execute(query, (org))
    rows = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
    cases = [dict(zip(columns, row)) for row in rows]

    return {
      "message": "Success",
      "org_id": org_row[0],
      "org_name": org_row[1],
      "cases": cases
    }
  
  except pyodbc.Error as e:
    print(f"Database error: {e}")
    return "Failed"
  
  finally:
    conn.close()

def create_case(data: Case):
  conn = get_db_connection()
  cursor = conn.cursor()

  try: 
    query = """
    INSERT INTO cases (org_id, created_by_user_id, title, description, status)
    VALUES (? ? ? ? ?)
    """
    cursor.execute(query, (data.org_id, data.created_by, data.title, data.description, data.status))
    conn.commit()
    return True
  except pyodbc.Error:
    conn.rollback()
    return False
  finally:
    conn.close()
    
def list_case_evidence(case_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = "SELECT * FROM Evidence WHERE case_id = ?"
        cursor.execute(query, (case_id,))
        rows = cursor.fetchall()

        evidence = [
            {
              "file_id":           str(row[0]),
              "case_id":           row[1],
              "file_name":         row[2],
              "file_extension":    row[3],
              "content_type":      row[4],
              "checksum_sha256":   row[5],
              "metadata_json":     row[6],
              "upload_date":       row[7],
              "uploaded_by":       row[8],
              "processing_status": row[9],
            }
            for row in rows
        ]

        return {
           "Message": "Success", 
           "Evidence": evidence
        }

    except pyodbc.Error as e:
        print(f"Database error: {e}")
        return "Failed"

    finally:
        conn.close()

def get_case_detail(case_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Case + creator + org
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
                o.org_id,
                o.name          AS org_name,
                u.user_id       AS creator_id,
                u.first_name    AS creator_first_name,
                u.last_name     AS creator_last_name,
                u.email         AS creator_email
            FROM Cases c
            JOIN organizations o ON c.org_id = o.org_id
            JOIN users u         ON c.created_by_user_id = u.user_id
            WHERE c.case_id = ? AND c.deleted_at IS NULL
        """, (case_id,))

        case_row = cursor.fetchone()
        if not case_row:
            return {"message": "Case not found"}

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

def get_org_case(case_id: int, org_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # SELECT * FROM Cases WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL
        # Ensures org admin cannot access cases outside their org
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()

def get_case(case_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # SELECT * FROM Cases WHERE case_id = ? AND deleted_at IS NULL
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()

def update_case(case_id: int, **fields):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # UPDATE Cases SET ... WHERE case_id = ? AND deleted_at IS NULL
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()

def close_case(case_id: int, closed_by_user_id: int, resolution: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # UPDATE Cases SET status = 'Closed', closed_at = SYSDATETIMEOFFSET(),
        # closed_by_user_id = ?, resolution = ? WHERE case_id = ?
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()

def delete_case(case_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # UPDATE Cases SET deleted_at = SYSDATETIMEOFFSET() WHERE case_id = ?
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()