from fastapi import APIRouter
from .auth import router as Login_router
from .Organization import router as Organization_router
from .register import router as register_router
from .evidence import router as evidence_router
from .agent.case_agent import router as case_router


router = APIRouter(prefix="/Evaide")

router.include_router(Login_router)
router.include_router(Organization_router)
router.include_router(register_router)
router.include_router(evidence_router)
router.include_router(case_router)
