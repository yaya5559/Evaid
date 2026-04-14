from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import re

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    password: str
    role_id: int = 3
    org_id: Optional[int] = None

    @validator('phone_number')
    def validate_phone_number(cls, v):
        phone_regex = r'^[+]?[\d()\s-]{7,20}$'
        if not re.match(phone_regex, v):
            raise ValueError('Enter a valid phone number.')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters.')
        # Add more strength checks if needed, e.g., uppercase, numbers
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter.')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit.')
        return v

class UsersUpdate(BaseModel):
    user_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role_id: Optional[int] = None
    org_id: Optional[int] = None
