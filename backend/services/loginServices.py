from fastapi import HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from datetime import timedelta, datetime
from dotenv import load_dotenv
from database import get_db_connection  # imports the database logic
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
            SELECT u.user_id, u.password_hash, u.email, r.role_name
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
            "role_name": row[3]
        })
    finally:
        conn.close()

def create_access_token(user_name: str, remember: bool = False):
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
        expires_at = datetime.utcnow() + timedelta(days=7)
        hashedRefresh = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        
        query = """
            INSERT INTO user_sessions (user_id, token_hash, expires_at, is_valid)
            VALUES (?, ?, ?, 1)
        """
        cursor.execute(query, (user_id, hashedRefresh, expires_at))
        conn.commit()
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
    
