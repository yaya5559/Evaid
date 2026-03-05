from pydantic import BaseModel

class Case(BaseModel): 
  case_id: int
  org_id: int
  created_by: int
  title: str
  description: str
  status: str