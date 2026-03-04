from fastapi import Depends, HTTPException, status, APIRouter
from models.organization import Organization
import services.organizationServices as services
from dependencies.auth import require_roles

router = APIRouter(
   prefix="/Organization",
   tags=["Organization"],
   dependencies=[Depends(require_roles("evaide_admin"))],
)


@router.get("")
def list_organizations():
   return services.list_active_organization()

@router.post("/Add")
def addOrganization(data: Organization): 
    
    if not services.check_organization(data.company_name):
      raise HTTPException(
         status_code = status.HTTP_409_CONFLICT,
         detail = "Organization already exists"
      )
    
    if not services.add_Organization(data):
       raise HTTPException(
         status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
         detail = "Organization failed to be created"
       )
    
@router.patch("/disable_org")
def disable(org_name: str):
   if services.disable_organization(org_name):
      return "Success"
   else: 
      return "Failed"

@router.patch("/enable_org")
def disable(org_name: str):
   if services.enable_organization(org_name):
      return "Success"
   else: 
      return "Failed"
    
@router.delete("/Delete")
def delete_organization(name: str):
   if services.delete_organization(name):
      return "Success"
   else: 
      return "Failed"
    

    
