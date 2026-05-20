from fastapi import APIRouter, Depends, HTTPException, status
from dependencies.auth import require_roles
from services.registerUser import register_user
from models.register import RegisterRequest
import services.org_admin.org_user_services as services

router = APIRouter(prefix="/org/agents", tags=["Org Admin - Agents"])


@router.post("/register")
def register_org_agent(data: RegisterRequest, user: dict = Depends(require_roles("org_admin"))):
    org_id = user.get("claims", {}).get("org_id")
    if not org_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization not found")
    data.org_id = org_id
    
    data.role_id = 3  # always AGENT
    success = register_user(data)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return {"message": "Agent registered successfully"}


@router.get("/")
def list_org_agents(org_id: int):
    return services.list_org_agents(org_id)


@router.get("/{user_id}")
def get_org_agent(user_id: int, org_id: int):
    return services.get_org_agent(user_id, org_id)


@router.patch("/enable/{user_id}")
def enable_org_agent(user_id: int, org_id: int):
    return services.enable_org_agent(user_id, org_id)


@router.patch("/disable/{user_id}")
def disable_org_agent(user_id: int, org_id: int):
    return services.disable_org_agent(user_id, org_id)
