from fastapi import HTTPException, status, Response, APIRouter, Depends, Header
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from services.loginServices import( store_refresh_token, create_access_token, get_user_by_email, verify_password, decode_access_token)
import secrets

load_dotenv()
router = APIRouter(prefix="/auth", tags=["auth"])

#pydantic guarantees email and password exist 
class LoginRequest(BaseModel):
    email: EmailStr # pydantic's built in email validator
    password: str

# Abenezer: get function verifies jwt and returns the info from token
@router.get("/me")
def me(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise ValueError()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format"
        )
    
    payload = decode_access_token(token)

    return{
        "user_id": payload["user_id"],
        "email": payload["email"],
        "role": payload["role"]
    }

@router.post("/login")
def login(data: LoginRequest, response : Response, remember: bool = False ):
    email= data.email
    password = data.password

    user = get_user_by_email(email)
    
    # user with that email doesnt exist
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials - Email"
        )
        
    #wrong password
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials!! - Password"
        )
        
    # # we need database to get username
    # user_name = user.first_name

    token = create_access_token(
    user_id=user.user_id,
    email=user.email,
    role=user.role_id,
    remember=remember)

    refresh_token = secrets.token_urlsafe(64)

    #refreshToken should be in database
    store_refresh_token(
        user_id=user.user_id,
        refresh_token=refresh_token
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,   # false for localhost
        samesite="strict",
        path="/auth/refresh",
        max_age=60*60*24*7 #7days
    )

    return {
        "access_token":token
    }