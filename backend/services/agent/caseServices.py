from dotenv import load_dotenv
from database import get_db_connection
from models.cases import Case
import pyodbc

load_dotenv()

def list_cases(agent: int):
  conn = get_db_connection()
  cursor = conn.cursor()

  try: 
    query = "SELECT * FROM Cases WHERE created_by_user_id = ?"
    cursor.execute(query,(agent,))
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
    cursor.close()
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
