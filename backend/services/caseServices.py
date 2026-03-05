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

    cases = {
       {
        "case_id": row[0],
        "org_id": row[1],
        "created_by_user_id": row[2],
        "title": row[3],
        "description": row[4],
        "status": row[5],
        "created_at": row[6],
        "updated_at": row[7]
        }
        for row in rows
    }

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

    cases = {
       {
        "case_id": row[0],
        "org_id": row[1],
        "created_by_user_id": row[2],
        "title": row[3],
        "description": row[4],
        "status": row[5],
        "created_at": row[6],
        "updated_at": row[7]
        }
        for row in rows
    }

    return {
      "Message": "Success",
      "Cases": cases
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