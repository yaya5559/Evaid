from fastapi import APIRouter
from .auth import router as Login_router
from .Organization import router as Organization_router


router = APIRouter()

router.include_router(Login_router)
router.include_router(Organization_router)

