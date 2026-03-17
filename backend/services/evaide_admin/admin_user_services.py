from dotenv import load_dotenv
from database import get_db_connection
from models.register import UsersUpdate
import pyodbc

load_dotenv()

def list_all_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
            u.user_id,
            u.first_name,
            u.last_name,
            u.email, 
            u.phone_number,
            r.role_name,
            o.org_id,
            o.name AS organization_name,
            FROM users u
            JOIN roles r WHERE u.role_id = r.role_id
            JOIN organizations o WHERE u.org_id = o.org_id
            WHERE is_enabled = 1 AND deleted_at = NULL
                       """)
        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        users = [dict(zip(columns, row)) for row in rows]

        return{
            "message": "success",
            "users": users
        }
        
    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()


def list_all_disabled_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
            u.user_id,
            u.first_name,
            u.last_name,
            u.email, 
            u.phone_number,
            r.role_name,
            o.org_id,
            o.name AS organization_name,
            FROM users u
            JOIN roles r WHERE u.role_id = r.role_id
            JOIN organizations o WHERE u.org_id = o.org_id
            WHERE is_enabled = 0 AND deleted_at = NULL
                       """)
        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        users = [dict(zip(columns, row)) for row in rows]

        return{
            "message": "success",
            "users": users
        }
        
    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()


def get_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
            u.first_name,
            u.last_name,
            u.email, 
            u.phone_number,
            r.role_name,
            o.org_id,
            o.name AS organization_name,
            FROM users u
            JOIN roles r WHERE u.role_id = r.role_id
            JOIN organizations o WHERE u.org_id = o.org_id
            WHERE is_enabled = 1 AND deleted_at = NULL AND user_id = ?
                       """, user_id)
        rows = cursor.fetchone()
        columns = [column[0] for column in cursor.description]
        user = [dict(zip(columns, row)) for row in rows]

        return {
            "message": "success",
            "user": user
        }

    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()


def update_user(user_id: int, data: UsersUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    updates = data.model_dump(exclude_unset=True)

    if not updates:
      return {"message": "No fields to update"}

    set_clause = ", ".join([f"{key} = ?" for key in updates])
    values = list(updates.values()) + [user_id]

    try:
        cursor.execute(f"""
          UPDATE users SET
          {set_clause}
          WHERE user_id = ?
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


def enable_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE users
            SET is_enabled = 1 
            WHERE user_id = ?  
            """, user_id)
        
        conn.commit()
        return { "message": "User enabled successful"}
    
    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()


def disable_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE users
            SET is_enabled = 0 
            WHERE user_id = ?  
            """, user_id)
        
        conn.commit()
        return { "message": "User enabled successful"}
    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()


def change_user_role(user_id: int, new_role_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE users
            SET role_id = ?
            WHERE user_id = ?  
            """, (new_role_id, user_id,))
        
        conn.commit()
        return { "message": "User enabled successful"}
    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()


def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE users
            SET is_enabled = 0, deleted_at = SYSDATETIMEOFFSET() 
            WHERE user_id = ?  
            """, user_id)
        
        conn.commit()
        return { "message": "User enabled successful"}
    except pyodbc.Error as e:
        return {
            "message": "Error", 
            "error": str(e)
            }
    finally:
        cursor.close()
        conn.close()
