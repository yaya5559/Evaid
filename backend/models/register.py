from pydantic import BaseModel, EmailStr
from typing import Optional

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    password: str
    role_id: int = 3
    org_id: int = None # this is optional and can be assigned later

class UsersUpdate(BaseModel):
    user_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role_id: Optional[int] = None
    org_id: Optional[int] = None
