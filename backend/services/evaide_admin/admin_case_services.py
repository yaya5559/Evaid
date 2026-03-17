from dotenv import load_dotenv
from database import get_db_connection
from datetime import datetime, timezone
from models.cases import Case, UpdateCase, CloseCase
import pyodbc

load_dotenv()

def list_all_cases():
  conn = get_db_connection()
  cursor = conn.cursor()

  try: 
    cursor.execute("""
      SELECT
      c.case_id,
      c.CaseNumber,
      c.title,
      c.status,
      c.severity_level,
      o.org_id,
      o.name
      FROM Cases c
      JOIN organizations o ON c.org_id = o.org_id
      """)
    rows = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
    cases = [dict(zip(columns, row)) for row in rows]

    return {
      "Message": "Success",
      "Cases": cases
    }
  
  except pyodbc.Error as e:
      return {
          "message": "Error", 
          "error": str(e)
          }
  finally:
    conn.close()

def list_org_cases(org: int):
  conn = get_db_connection()
  cursor = conn.cursor()

  try: 
    cursor.execute("""
      SELECT
      c.case_id,
      c.CaseNumber,
      c.title,
      c.status,
      c.severity_level,
      o.org_id,
      o.name
      FROM Cases c
      JOIN organizations o ON c.org_id = o.org_id
      WHERE c.org_id = ?
      ORDER BY c.created_at DESC
      """, (org,))
    rows = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
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
    conn.close()

def create_case(data: Case, user: int):
  conn = get_db_connection()
  cursor = conn.cursor()

  try: 
    query = """
    INSERT INTO cases 
    (CaseNumber, title, description, 
    org_id, created_by_user_id, status, 
    priority, severity_level, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,)
    """
    cursor.execute(query, 
                   (data.case_number, data.title, data.description, 
                    data.org_id, data.created_by_user_id, data.status,
                    data.priority, data.severity_level, data.due_date,))
    conn.commit()
    return True
  except pyodbc.Error as e:
    conn.rollback()
    return {
        "message": "Error", 
        "error": str(e)
    }
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
                uc.first_name    AS closed_first_name,
                uc.last_name     AS closed_last_name,
                uc.email         AS closed_email,
            FROM Cases c
            JOIN organizations o ON c.org_id = o.org_id
            JOIN users u         ON c.created_by_user_id = u.user_id
            LEFT JOIN users uc ON c.closed_by_user_id = uc.user_id
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
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()

def update_case(case_id: int, data: UpdateCase):
    conn = get_db_connection()
    cursor = conn.cursor()

    updates = data.model_dump(exclude_unset=True)

    if not updates:
      return {"message": "No fields to update"}

    set_clause = ", ".join([f"{key} = ?" for key in updates])
    values = list(updates.values()) + [case_id]

    try:
        cursor.execute(f"""
          UPDATE Cases SET
          {set_clause}
          WHERE case_id = ?
          """, values)
        conn.commit()

        return {"message": "Update Success"}
    
    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()

def close_case(data: CloseCase):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
          UPDATE Cases
          SET 
          status = ?,
          closed_at = SYSDATETIMEOFFSET(),
          resolution = ?,
          closed_by_user_id = ?
          WHERE case_id = ?
          """, 
          (data.status, data.resolution, data.closed_by_user_id, data.case_id,))
      
        conn.commit()
        return {"message": "Cased closed successfully"}
    
    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()

def delete_case(case_id: int, user: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(""""
          UPDATE Cases
          SET 
          deleted_at = SYSDATETIMEOFFSET(),
          closed_by_user_id = ? 
          WHERE case_id = ?            
          """, 
          (user, case_id,))
        
        conn.commit()
        return {"message": "Cased deleted successfully"}
    
    except pyodbc.Error as e:
         return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()