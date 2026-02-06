from dotenv import load_dotenv
from database import get_db_connection 
from models.organization import Organization
from services.registerUser import register_user
from passlib.context import CryptContext # for password hashing
import pyodbc

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

def check_organization(name: str):
  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    query = "SELECT 1 FROM organization WHERE name = ? AND deleted_at IS NULL"
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

  hashed_password = pwd_context.hash(Organization.password)

  try:
    org_query = "" \
    "INSERT INTO organizations (name, description, is_active)" \
    "VALUES (?, ?, 1)"

    cursor.execute(org_query, (Organization.company_name, f"Organization for {Organization.company_name}"))

    cursor.execute("SELECT @@IDENTITY as org_id")
    org_id = cursor.fetchone()
    
    user_query = "" \
    "INSERT INTO users (first_name, last_name, email, password_hash, role_id, org_id, is_enabled)" \
    "VALUES (?, ?, ?, ?, 2, ?, 1)"

    cursor.execute(user_query, (data.first_name, data.last_name, data.email, hashed_password, org_id))

    conn.commit()
    return True

  except pyodbc.IntegrityError:
    conn.rollback()
    return False

  finally:
    conn.close()