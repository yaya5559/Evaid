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

# Adds an organization to the database 
def add_Organization(data: Organization):
  conn = get_db_connection()
  cursor = conn.cursor()

  hashed_password = pwd_context.hash(data.password)

  try:
    org_query = "" \
    "INSERT INTO organizations (name, email, phone_number description, is_active,)" \
    "VALUES (?, ?, ?, ?, 1)"

    cursor.execute(org_query, (data.company_name, data.company_email, data.company_phone_number, f"Organization for {data.company_name}"))

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

# Disables an organization but does not delete it
def disable_organization(name: str):

  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    query = "UPDATE organizations SET is_active = 0 WHERE name = ?"
    cursor.execute(query, (name))

    conn.commit()
    return True
  
  except pyodbc.IntegrityError:
    conn.rollback()
    return False
  
  finally:
    conn.close()

# Enables a previously disabled organization
def enable_organization(name: str):
  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    query = "UPDATE organizations SET is_active = 1 WHERE name = ?"
    cursor.execute(query, (name))
    conn.commit()
    return True
  
  except pyodbc.IntegrityError:
    conn.rollback()
    return False
  
  finally:
    conn.close()

# Hard deletes an organization
def delete_organization(name: str):
  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    delete_query = "DELETE FROM organizations WHERE name = ?"
    cursor.execute(delete_query, (name))
    conn.commit()
  
    if cursor.rowcount == 0:
      return False  # No rows deleted (not found)
    
    return True

  except pyodbc.Error:
    conn.rollback()
    return False
  
  finally:
    conn.close()

# Changes the owner of an organization
# Need to check if team wants to delete old owner, or do something else with them
# Need to create a new user for new owner
def change_owner(new_owner: int, old_owner: str):
  conn = get_db_connection()
  cursor = conn.cursor()

  try: 
    query = "UPDATE organizations SET owner_id = ? WHERE name = ?"
    cursor.execute(query, (new_owner, old_owner))
    conn.commit()
    return True

  except pyodbc.IntegrityError:
    conn.rollback()
    return False

  finally:
    conn.close()

# Lists all active organizations 
def list_active_organization():

  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    query = "SELECT * FROM Organizations WHERE is_active = 1"
    cursor.execute(query)
    rows = cursor.fetchall()
    return rows
  
  except pyodbc.Error:
    return None
  
  finally:
    conn.close()

# Lists organizations that have been disabled but not deleted
def list_disabled_organization():
  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    query = "SELECT * FROM Organizations WHERE is_active = 0"
    cursor.execute(query)
    rows = cursor.fetchall()
    return rows
  
  except pyodbc.Error:
    return None
  
  finally:
    conn.close()

# Displays all the information needed for an organization
# Still need to add the following
# Cases, Evidence, Agents, Owner, Phone Number, Email, 
# Add ability to view dashboard from organization perspective
def organization_details(org_name: str):
  conn = get_db_connection()
  cursor = conn.cursor()

    


# def change_name(new_name: str, org_id: int)