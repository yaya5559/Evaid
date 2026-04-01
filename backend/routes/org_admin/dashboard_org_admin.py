from fastapi import APIRouter, Depends
import services.org_admin.org_dashboard_services as services
from dependencies.auth import require_roles, get_user_org_id

router = APIRouter(prefix="/org/dashboard", tags=["Org Admin - Dashboard"])


@router.get("/summary")
def get_org_dashboard_summary(user: dict = Depends(require_roles("org_admin"))):
    org_id = get_user_org_id(user["user_id"])
    if not org_id:
        return {"message": "User not associated with an organization"}
    return services.get_org_dashboard_summary(org_id)