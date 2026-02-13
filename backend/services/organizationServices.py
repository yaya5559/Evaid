from dotenv import load_dotenv
from database import get_db_connection 
from models.organization import Organization
from services.registerUser import register_user
from passlib.context import CryptContext # for password hashing
import pyodbc

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

def get_organization_id(name:str):

  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    query = "SELECT org_id FROM organizations WHERE name = ? AND deleted_at IS NULL"
    cursor.execute(query, (name,))
    result = cursor.fetchone()

    if result:
            return result[0]  # Extract the org_id value
    return None
  
  finally:
    conn.close()


def check_organization(name: str):
  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    query = "SELECT 1 FROM organizations WHERE name = ? AND deleted_at IS NULL"
    cursor.execute(query, (name,))
    verification = cursor.fetchone()

    if verification:
      return False
    
    return True
  
  finally:
    conn.close()

  
def add_Organization(data: Organization):
  conn = get_db_connection()
  cursor = conn.cursor()

  hashed_password = pwd_context.hash(data.password)

  try:
    org_query = "" \
    "INSERT INTO organizations (name, description, is_active)" \
    "VALUES (?, ?, 1)"

    cursor.execute(org_query, (data.company_name, f"Organization for {data.company_name}"))

    cursor.execute("SELECT CAST(SCOPE_IDENTITY() AS INT)")
    org_id = cursor.fetchone()[0]
    
    user_query = "" \
    "INSERT INTO users (first_name, last_name, email, password_hash, role_id, org_id, is_enabled)" \
    "VALUES (?, ?, ?, ?, 2, ?, 1)"

    cursor.execute(user_query, (data.first_name, data.last_name, data.email, hashed_password, org_id))
    
    cursor.execute("SELECT CAST(SCOPE_IDENTITY() AS INT)")
    user_id = cursor.fetchone()[0]


    update_query = "UPDATE organizations SET owner_id = ? WHERE org_id = ?"
    cursor.execute(update_query, (user_id, org_id))

    conn.commit()
    return True

  except pyodbc.IntegrityError:
    conn.rollback()
    return False

  finally:
    conn.close()

def delete_organization(data:Organization):

  conn = get_db_connection()
  cursor = conn.cursor()

  try:

    delete_query = "DELETE FROM organizations WHERE name = ?"
    cursor.execute(delete_query, (data.company_name,))
    conn.commit()
  
    if cursor.rowcount == 0:
      return False  # No rows deleted (not found)
    
    return True

  except:
    conn.rollback()
    return False
  
  finally:
    conn.close()

def change_owner(new_owner: int, org_id: int):

  conn = get_db_connection()
  cursor = conn.cursor()

  try: 

    query = "UPDATE organizations SET owner_id = ? WHERE org_id = ?"
    cursor.execute(query, (new_owner, org_id))
    conn.commit()


  finally:
    conn.close()

def change_name(new_name: str, org_id: int)