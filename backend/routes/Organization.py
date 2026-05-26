from fastapi import Depends, HTTPException, status, APIRouter
from models.organization import Organization, editedOrg
import services.organizationServices as services
from dependencies.auth import require_roles
import pyodbc


router = APIRouter(
   prefix="/Organization",
   tags=["Organization"],
   dependencies=[Depends(require_roles("evaide_admin"))],
)

@router.get("")
def list_organizations():
   try:
      return services.list_active_organization()
   except pyodbc.Error:
      raise HTTPException(
         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
         detail="Failed to load organizations",
      )

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

    return {"message": "Organization created successfully"}

# @router.get("/Organization_Info")
# def get_information(name:str):
#    return services.organization_info(name)
    
@router.patch("/{org_name}/disable")
def disable_org(org_name: str):
   if services.disable_organization(org_name):
      return "Success"
   else:
      return "Failed"

@router.patch("/{org_name}/enable")
def enable_org(org_name: str):
   if services.enable_organization(org_name):
      return "Success"
   else:
      return "Failed"

@router.delete("/{name}")
def delete_organization(name: str):
   if services.delete_organization(name):
      return "Success"
   else:
      return "Failed"
    

@router.put("/{organization_id}")
def Edit_organization(organization_id: int, organization: editedOrg):
   try:
      updated = services.edit_organization(organization_id, organization)
   except pyodbc.IntegrityError:
      raise HTTPException(
         status_code=status.HTTP_409_CONFLICT,
         detail="Organization name or email already exists",
      )
   except pyodbc.Error:
      raise HTTPException(
         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
         detail="Failed to update organization",
      )
   
   if not updated:
      raise HTTPException(
         status_code=status.HTTP_404_NOT_FOUND,
         detail="Organization not found",
      )
   
   return {"message":"Organization updated successfully"}


