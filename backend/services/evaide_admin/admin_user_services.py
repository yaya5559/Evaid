from dotenv import load_dotenv
from database import get_db_connection
from models.cases import Case
import pyodbc

load_dotenv()

def list_all_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # SELECT all users joined with organizations and roles, WHERE deleted_at IS NULL
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def get_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # SELECT * FROM users WHERE user_id = ? AND deleted_at IS NULL
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def update_user(user_id: int, **fields):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # UPDATE users SET ..., updated_at = SYSDATETIMEOFFSET() WHERE user_id = ?
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def enable_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # UPDATE users SET is_enabled = 1 WHERE user_id = ?
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def disable_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # UPDATE users SET is_enabled = 0 WHERE user_id = ?
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def change_user_role(user_id: int, new_role_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # UPDATE users SET role_id = ? WHERE user_id = ?
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # UPDATE users SET deleted_at = SYSDATETIMEOFFSET() WHERE user_id = ?
        pass
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()
