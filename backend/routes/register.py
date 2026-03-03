from fastapi import HTTPException, status, APIRouter
from models.register import RegisterRequest
from services.registerUser import register_user

router = APIRouter(prefix="/Register", tags=["Register"])

# Handles new user registration
@router.post("/register")
def register(data: RegisterRequest):
    # new users default to AGENT role (role_id = 3)
    success = register_user(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        password=data.password,
        role_id=data.role_id, 
        org_id=data.org_id
    )
    
    # check if registration failed (most likely due to duplicated email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    return {"message": "User created successfully"}