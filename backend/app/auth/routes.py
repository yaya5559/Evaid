from fastapi import APIRouter, Depends, HTTPException, status
import jwt_handler as jwtFunc

router = APIRouter()

@router.post("/reigster")
def register_user(data: dict):
  return data

@router.get("/login")
def login_user(username: str, password: str):
  jwtFunc.authenticate_user()
  return {"username": username, "password": password}