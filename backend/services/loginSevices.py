from fastapi import HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from datetime import timedelta, datetime
from dotenv import load_dotenv
import secrets
import jwt
import os

load_dotenv()

#pydantic gurantees email and password exist 
class LoginRequest(BaseModel):
    email: EmailStr # pydantic's built in email validator
    password: str




    
def verify_password(password, password_hash):
    #database needed

    return False


def get_user_by_email(email):

    # database needed


    return


def create_access_token(user_name: str, remember: bool = False):
    expires =  timedelta(minutes=15) # represents a duration of time 

    #remember signifies how long this login should stay valid
    # token lifetime policy 
    if remember : 
        expires = timedelta(days=7)


    payload = {
        "sub": user_name,
        "exp": datetime.utcnow()+expires
    }

    JWT_SECRET = os.getenv("JWT_SECRET")

    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET not set")

    token = jwt.encode(payload, JWT_SECRET, algorithm = "HS256")

    return token


def store_refresh_token(user_id, refresh_token):
    #Store refresh token
    return