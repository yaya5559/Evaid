from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role_id: int = 3
    org_id: int = None # this is optional and can be assigned later