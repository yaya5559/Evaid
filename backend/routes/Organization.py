from fastapi import HTTPException, status, APIRouter
from models.organization import Organization
import services.organizationServices as services

router = APIRouter(prefix="/Organization", tags=["Organization"])


@router.get("/")
def list_organizations():
   return services.list_active_organization()

@router.get("/{org_name}")
   

@router.post("/Add")
def addOrganization(data: Organization): 
    
    if not services.check_organization(data.company_name):
      raise HTTPException(
         status_code = status.HTTP_409_CONFLICT,
         detail = "Organization already exists"
      )
    
    if not services.add_Organization(data):
       raise HTTPException(
         status_code = status.HTTP_500_CONFLICT,
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
    

    