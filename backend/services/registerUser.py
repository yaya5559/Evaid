from dotenv import load_dotenv
from database import get_db_connection  # imports the database logic
from passlib.context import CryptContext # for password hashing
import pyodbc
from models.register import RegisterRequest 

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)


# Creates new user account in the database
def register_user(data: RegisterRequest):
    # Hashes password and saves a new user to Azure SQL.
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # securely hash the password before storing
    hashed_password = pwd_context.hash(data.password)
    
    try:
        query = """
            INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role_id, org_id, is_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """
        cursor.execute(query, (data.first_name, data.last_name, data.email, data.phone_number, hashed_password, data.role_id, data.org_id))
        conn.commit()
        return True
    except pyodbc.IntegrityError:
        # happens when email already exists in evaide_db
        return False
    finally:
        conn.close()