from pydantic import BaseModel, EmailStr

class Organization(BaseModel):
    company_name: str
    company_email: EmailStr
    company_phone_number: str
    owner_first_name: str
    owner_last_name: str
    owner_email: EmailStr
    owner_phone_number: str
    password: str

class editedOrg(BaseModel):
    org_id: int
    companyName: str
    companyEmail: EmailStr
    companyPhoneNumber: str
    ownerFirstName: str
    ownerLastName: str
    ownerEmail: str
    ownerPhoneNumber: str
    status: str
    description: str
