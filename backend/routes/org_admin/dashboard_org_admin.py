from fastapi import APIRouter, Depends
import services.org_admin.org_dashboard_services as services
import services.evaide_admin.admin_dashboard_services as admin_services
from dependencies.auth import require_roles, get_user_org_id

router = APIRouter(prefix="/org/dashboard", tags=["Org Admin - Dashboard"])
dashboard_router = APIRouter(prefix="/dashboard", tags=["Evaide Admin - Dashboard"])


@router.get("/summary")
def get_org_dashboard_summary(user: dict = Depends(require_roles("org_admin"))):
    org_id = get_user_org_id(user["user_id"])
    if not org_id:
        return {"message": "User not associated with an organization"}
    return services.get_org_dashboard_summary(org_id)


@dashboard_router.get("/kpis")
def get_admin_dashboard_kpis(user: dict = Depends(require_roles("evaide_admin"))):
    return admin_services.get_admin_dashboard_kpis()


@dashboard_router.get("/pipeline")
def get_admin_dashboard_pipeline(user: dict = Depends(require_roles("evaide_admin"))):
    return admin_services.get_admin_dashboard_pipeline()


@dashboard_router.get("/activity")
def get_admin_dashboard_activity(user: dict = Depends(require_roles("evaide_admin"))):
    return admin_services.get_admin_dashboard_activity()
