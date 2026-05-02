from fastapi import APIRouter, Depends
from pydantic import BaseModel, validator
from typing import Optional
from dependencies.auth import get_current_user
import services.agent.agent_profile_services as services

router = APIRouter(prefix="/agent/profile", tags=["Agent - Profile"])


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None

    @validator("first_name", "last_name")
    def validate_non_empty_name(cls, value):
        if value is not None and not value.strip():
            raise ValueError("must not be empty")
        return value


@router.get("/{agent_id}")
def get_profile(agent_id: int, current_user=Depends(get_current_user)):
    """Get agent profile"""
    # Verify the user can only access their own profile
    user_id = current_user.get("user_id")
    if user_id != agent_id:
        return {"message": "Error", "error": "Unauthorized"}
    
    return services.get_agent_profile(agent_id)


@router.patch("/{agent_id}")
def update_profile(
    agent_id: int,
    data: UpdateProfileRequest,
    current_user=Depends(get_current_user)
):
    """Update agent profile"""
    # Verify the user can only update their own profile
    user_id = current_user.get("user_id")
    if user_id != agent_id:
        return {"message": "Error", "error": "Unauthorized"}
    
    return services.update_agent_profile(
        agent_id,
        data.first_name,
        data.last_name,
        data.phone_number,
        data.profile_picture
    )
