from fastapi import HTTPException, status, Response, APIRouter, Depends, Header, Cookie
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import services.loginServices as logFuncs
import secrets

load_dotenv()
router = APIRouter(prefix="/auth", tags=["Auth"])

#pydantic guarantees email and password exist 
class LoginRequest(BaseModel):
    email: EmailStr # pydantic's built in email validator
    password: str


@router.post("/refresh")
def refresh_token(response: Response, refresh_token: str = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No session cookie found")

    user = logFuncs.get_refresh_token(refresh_token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    token = logFuncs.create_access_token(
        user_id=user.user_id,
        email=user.email,
        role=user.role_name,
        org_id=user.org_id,
        remember=True
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,   # false for localhost
        samesite="strict",
        path="/",
        max_age=60*60*24*7 #7days
    )

    return {
        "accessToken": token
    }

@router.post("/login")
def login(data: LoginRequest, response : Response, remember: bool = False ):
    email= data.email
    password = data.password

    user = logFuncs.get_user_by_email(email)
    
    # user with that email doesn't exist
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials - Email"
        )
        
    #wrong password
    if not logFuncs.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials!! - Password"
        )
        
    # # we need database to get username
    # user_name = user.first_name
    token = logFuncs.create_access_token(
        user_id=user.user_id,
        email=user.email,
        role=user.role_name,
        org_id=user.org_id,
        remember=remember
    )

    #creates a cryptographically secure random string
    refresh_token = secrets.token_urlsafe(64)

    #refreshToken should be in database
    logFuncs.store_refresh_token(
        user_id=user.user_id,
        refresh_token=refresh_token
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,   # false for localhost
        samesite="strict",
        path="/",
        max_age=60*60*24*7 #7days
    )

    return {
        "accessToken":token
    }

@router.post("/logout")
def logout(response: Response, refresh_token: str = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No session cookie found")
    
    logout = logFuncs.end_user_session(refresh_token)

    if not logout:
        raise HTTPException(status_code=401, detail="Unable to logout user")
    
    return "logout success"