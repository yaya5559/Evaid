from fastapi import APIRouter
import services.evaide_admin.admin_org_services as services

router = APIRouter(prefix="/admin/organizations", tags=["Evaide Admin - Organizations"])


@router.get("/")
def list_all_organizations():
    return services.list_all_organizations()


@router.get("/{org_id}/cases")
def get_org_cases(org_id: int):
    return services.get_org_cases(org_id)
