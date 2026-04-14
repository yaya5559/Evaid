from fastapi import HTTPException, status, APIRouter
from models.register import RegisterRequest
from services.registerUser import register_user

router = APIRouter(prefix="/Register", tags=["Register"])

# Handles new user registration
@router.post("")
def register(data: RegisterRequest):
    # new users default to AGENT role (role_id = 3)
    try:
        success = register_user(data)
        if success:
            return {"message": "User created successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

