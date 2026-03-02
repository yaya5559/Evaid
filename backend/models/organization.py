from pydantic import BaseModel, EmailStr

class Organization(BaseModel):
    company_name: str
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    password: str