import re

from pydantic import BaseModel, EmailStr, validator

class Organization(BaseModel):
    company_name: str
    company_email: EmailStr
    company_phone_number: str
    owner_first_name: str
    owner_last_name: str
    owner_email: EmailStr
    owner_phone_number: str
    password: str

    @validator('company_phone_number', 'owner_phone_number')
    def validate_phone_number(cls, v):
        phone_regex = re.compile(r'^[+]?[0-9()\s-]{7,20}$')
        if not phone_regex.match(v):
            raise ValueError('Enter a valid phone number.')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters.')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter.')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit.')
        return v

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
