from fastapi import Request, HTTPException, status, Response, Cookie
from pydantic import BaseModel, EmailStr
from datetime import timedelta, datetime, timezone
from dotenv import load_dotenv
from services.database import get_db_connection  # imports the database logic
from passlib.context import CryptContext # for password hashing
import jwt
import os
import hashlib
 
load_dotenv()

# Setup for bcrypt password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

#pydantic guarantees email and password exist 
class LoginRequest(BaseModel):
    email: EmailStr # pydantic's built in email validator
    password: str

# Checks if the password matches the hash stored in evaide_db
def verify_password(password, password_hash):
    # Verifies the plain text password against the stored hash.
    return pwd_context.verify(password, password_hash)
    
# Grabs user info from database by email
def get_user_by_email(email):
    conn = get_db_connection()#opens a database connection
    cursor = conn.cursor()
    try:
        # only get active users (checks for soft delete)
        query = """
            SELECT u.user_id, u.password_hash, u.email, r.role_name, u.org_id
            FROM users u
            JOIN roles r ON r.role_id = u.role_id
            WHERE u.email = ? AND u.deleted_at IS NULL
        """
        cursor.execute(query, (email,))
        row = cursor.fetchone()

        if not row:
            return None

        # create a simple user object to return
        return type('User', (object,), {
            "user_id": row[0],
            "password_hash": row[1],
            "email": row[2],
            "role_name": row[3],
            "org_id": row[4]
        })
    finally:
        conn.close()

def create_access_token(user_id: int, email: str, role: str, org_id: int = None, remember: bool = False):
    expires =  timedelta(minutes=15) # represents a duration of time

    #remember signifies how long this login should stay valid
    # token lifetime policy
    if remember :
        expires = timedelta(days=7)

    # Abenezer: updated payload and parameters of
    # function to include userid, email and role
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "org_id": org_id,
        # "sub": user_name,
        "exp": datetime.utcnow()+expires
    }

    JWT_SECRET = os.getenv("JWT_SECRET")

    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET not set")

    token = jwt.encode(payload, JWT_SECRET, algorithm = "HS256")

    return token

# Abenezer: decode token function
def decode_access_token(token: str):
    JWT_SECRET = os.getenv("JWT_SECRET")
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET not set")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid Token"
        )

# Saves refresh token to database for session management
def store_refresh_token(user_id, refresh_token):
    # Saves the refresh token into the user_sessions table.
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # refresh tokens are valid for 7 days
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        hashedRefresh = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        
        query = """
            INSERT INTO user_sessions (user_id, token_hash, expires_at, is_valid)
            VALUES (?, ?, ?, 1)
        """
        cursor.execute(query, (user_id, hashedRefresh, expires_at))
        conn.commit()
    finally:
        conn.close()

# Access the refresh token from the database
def get_refresh_token(refresh_token):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        hashedRefresh = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        query = """
            SELECT u.user_id, u.email, r.role_name, u.org_id
            FROM user_sessions s
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN roles r ON r.role_id = u.role_id
            WHERE s.token_hash = ? AND s.is_valid = 1 AND s.expires_at > SYSDATETIMEOFFSET() AND u.deleted_at IS NULL
        """
        cursor.execute(query, (hashedRefresh,))
        row = cursor.fetchone()

        if not row:
            return None

        return type('User', (object,), {
            "user_id": row[0],
            "email": row[1],
            "role_name": row[2],
            "org_id": row[3]
        })
    finally:
        conn.close()

def end_user_session(refresh_token):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        hashedRefresh = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        query = "UPDATE user_sessions SET is_valid = 0 WHERE token_hash = ?"
        cursor.execute(query, (hashedRefresh,))
        conn.commit()
        return True
  
    except:
        conn.rollback()
        return False
  
    finally:
        conn.close()

#gets role name :
def getRoleName(role_id:int):
    conn = get_db_connection()#opens a database connection
    cursor = conn.cursor()
    try:
        query = """
            SELECT role_name
            FROM roles
            WHERE role_id = ?
        """

        cursor.execute(query, (role_id,))
        row = cursor.fetchone()

        if not row:
            return None
        
        return row[0]
    finally:
        conn.close()

def get_current_user(request:Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    
    token = auth_header.replace("Bearer", "")

    try:
        payload = decode_access_token(token)
    except:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload
