from fastapi import APIRouter
from .auth import router as Login_router


router = APIRouter()

router.include_router(Login_router, prefix="/v1")

