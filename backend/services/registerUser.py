from dotenv import load_dotenv
from database import get_db_connection  # imports the database logic
from passlib.context import CryptContext # for password hashing
import pyodbc

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)


# Creates new user account in the database
def register_user(first_name, last_name, email, password, role_id, org_id=None):
    # Hashes password and saves a new user to Azure SQL.
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # securely hash the password before storing
    hashed_password = pwd_context.hash(password)
    
    try:
        query = """
            INSERT INTO users (first_name, last_name, email, password_hash, role_id, org_id, is_enabled)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        """
        cursor.execute(query, (first_name, last_name, email, hashed_password, role_id, org_id))
        conn.commit()
        return True
    except pyodbc.IntegrityError:
        # happens when email already exists in evaide_db
        return False
    finally:
        conn.close()