from dotenv import load_dotenv
from services.database import get_db_connection 
from models.organization import Organization
from passlib.context import CryptContext # for password hashing
import pyodbc
from services.database import get_db_connection 
from models.organization import Organization, editedOrg

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
    "INSERT INTO organizations (name, email, phone_number, description, is_active)" \
    "VALUES (?, ?, ?, ?, 1)"

    cursor.execute(org_query, (data.company_name, data.company_email, data.company_phone_number, f"Organization for {data.company_name}"))

    cursor.execute("SELECT CAST(SCOPE_IDENTITY() AS INT)")
    org_id = cursor.fetchone()[0]
    
    user_query = "" \
    "INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role_id, org_id, is_enabled)" \
    "VALUES (?, ?, ?, ?, ?, 2, ?, 1)"

    cursor.execute(user_query, (data.owner_first_name, data.owner_last_name, data.owner_email, data.owner_phone_number, hashed_password, org_id))
    
    cursor.execute("SELECT CAST(SCOPE_IDENTITY() AS INT)")
    user_id = cursor.fetchone()[0]


    update_query = "UPDATE organizations SET owner_id = ? WHERE org_id = ?"
    cursor.execute(update_query, (user_id, org_id))

    conn.commit()
    return True

  except pyodbc.Error as e:
    print(f"[add_Organization] DB error: {e}")
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
    query = """
      SELECT
        o.org_id,
        o.name,
        o.email,
        COALESCE(o.phone_number, ''),
        COALESCE(u.first_name, ''),
        COALESCE(u.last_name, ''),
        COALESCE(u.email, ''),
        COALESCE(u.phone_number, ''),
        CASE WHEN o.is_active = 0 THEN 'suspended' ELSE 'active' END,
        COALESCE(o.description, ''),
        COALESCE(CONVERT(VARCHAR(33), o.updated_at, 127), '')
      FROM organizations AS o
      LEFT JOIN users AS u
        ON u.user_id = o.owner_id
      WHERE o.is_active = 1
      ORDER BY o.name
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    
    organizations = [
      {
        "org_id": row[0],
        "companyName": row[1],
        "companyEmail": row[2],
        "companyPhoneNumber": row[3],
        "ownerFirstName": row[4],
        "ownerLastName": row[5],
        "ownerEmail": row[6],
        "ownerPhoneNumber": row[7],
        "status": row[8],
        "description": row[9],
        "updatedAt": row[10],
      }
      for row in rows
    ]
    
    return {
      "message": "Success",
      "organizations": organizations
    }
  except pyodbc.Error as e:
    print(f"Database error: {e}")
    raise
   
  finally:
    conn.close()

# Lists organizations that have been disabled but not deleted
def list_disabled_organization():
  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    query = "SELECT name, email FROM Organizations WHERE is_active = 0"
    cursor.execute(query)
    rows = cursor.fetchall()

    organizations = [
      {"id": row[0], "name": row[1], "email": row[2]}
      for row in rows
    ]
    return {
      "message": "Success",
      "organizations": organizations
      }

  except pyodbc.Error:
    return None
  
  finally:
    conn.close()

# Lists active agents in an organization
def list_active_agents(name: str):
  conn = get_db_connection()
  cursor = conn.cursor()

  query = "SELECT org_id FROM organizations WHERE name = ? AND deleted_at IS NULL"
  cursor.execute(query, (name,))
  org_id = cursor.fetchone()

  try:
    query = "SELECT first_name, last_name, email, phone_number FROM users WHERE org_id = ? AND is_active = 1"
    cursor.execute(query, org_id)
    results = cursor.fetchall()

    if results:
      return results
    return None
  
  except pyodbc.Error:
    return None
  
  finally:
    conn.close()
    
# List disabled agents in an organization    
def list_disabled_agents(name: str):
  conn = get_db_connection()
  cursor = conn.cursor()

  query = "SELECT org_id FROM organizations WHERE name = ? AND deleted_at IS NULL"
  cursor.execute(query, (name,))
  org_id = cursor.fetchone()

  try:
    query = "SELECT first_name, last_name, email, phone_number FROM users WHERE org_id = ? AND is_active = 0"
    cursor.execute(query, org_id)
    results = cursor.fetchall()

    if results:
      return results
    return None
  
  except pyodbc.Error:
    return None
  
  finally:
    conn.close()

def edit_organization(org_id: int, data: editedOrg):
  conn = get_db_connection()
  cursor = conn.cursor()

  try:
    is_active = 0 if data.status.strip().lower() == "suspended" else 1

    cursor.execute(
      "SELECT owner_id FROM organizations WHERE org_id = ? AND deleted_at IS NULL",
      (org_id,),
    )
    owner_row = cursor.fetchone()
    if not owner_row:
      return False

    owner_id = owner_row[0]

    organization_update_query = """
      UPDATE organizations
      SET name = ?,
          email = ?,
          phone_number = ?,
          description = ?,
          is_active = ?,
          updated_at = SYSDATETIMEOFFSET()
      WHERE org_id = ? AND deleted_at IS NULL
    """
    cursor.execute(
      organization_update_query,
      (
        data.companyName,
        data.companyEmail,
        data.companyPhoneNumber,
        data.description,
        is_active,
        org_id,
      ),
    )

    organization_updated = cursor.rowcount > 0
    if not organization_updated:
      conn.rollback()
      return False

    if owner_id is not None:
      owner_update_query = """
        UPDATE users
        SET first_name = COALESCE(NULLIF(?, ''), first_name),
            last_name = COALESCE(NULLIF(?, ''), last_name),
            email = COALESCE(NULLIF(?, ''), email),
            phone_number = COALESCE(NULLIF(?, ''), phone_number),
            updated_at = SYSDATETIMEOFFSET()
        WHERE user_id = ? AND deleted_at IS NULL
      """
      cursor.execute(
        owner_update_query,
        (
          data.ownerFirstName,
          data.ownerLastName,
          data.ownerEmail,
          data.ownerPhoneNumber,
          owner_id,
        ),
      )

    conn.commit()
    return True
  
  except pyodbc.Error:
    conn.rollback()
    raise

  finally:
    conn.close()
    





# def disable_agent(org: str, agent: int):
#   conn = get_db_connection()
#   cursor = conn.cursor()

#   query = "SELECT org_id FROM organizations WHERE name = ? AND deleted_at IS NULL"
#   cursor.execute(query, (org))
#   org_id = cursor.fetchone()

#   try:
#     query = "UPDATE users SET is_active = 0 WHERE org_id = ? AND user_id = ? "
#     cursor.execute(query, (org_id, agent))

# Displays all the information needed for an organization
# Still need to add the following
# Cases, Evidence, Agents, Owner, Phone Number, Email, 
# Add ability to view dashboard from organization perspective
# def organization_details(org_name: str):
#   conn = get_db_connection()
#   cursor = conn.cursor()

#   try: 

    


# def change_name(new_name: str, org_id: int)

