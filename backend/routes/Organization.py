from fastapi import HTTPException, status, APIRouter
from models.organization import Organization
from dotenv import load_dotenv
from services.organizationServerice import check_organization, add_Organization

load_dotenv()
router = APIRouter(prefix="/Organization")


@router.post("/Add_Organization")

def addOrganization(data: Organization): 
    
    if not check_organization(data.companyName):
      raise HTTPException(
         status_code = status.HTTP_409_CONFLICT,
         detail = "Organization already exists"
      )
    
    if not add_Organization(data):
       raise HTTPException(
         status_code = status.HTTP_500_CONFLICT,
         detail = "Organization failed to be created"
       )
    

    

    