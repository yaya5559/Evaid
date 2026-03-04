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