from fastapi import APIRouter
from .auth import router as login_router
from .Organization import router as organization_router
from .register import router as register_router
from .evidence import router as evidence_router

# Agent routes
from .agent.case_agent import router as agent_case_router
from .agent.evidence_agent import router as agent_evidence_router
from .agent.note_agent import router as agent_note_router

# Org Admin routes
from .org_admin.case_org_admin import router as org_case_router
from .org_admin.user_org_admin import router as org_user_router
from .org_admin.evidence_org_admin import router as org_evidence_router
from .org_admin.note_org_admin import router as org_note_router
from .org_admin.assignment_org_admin import router as org_assignment_router

# Evaide Admin routes
from .evaide_admin.case_evaide_admin import router as admin_case_router
from .evaide_admin.user_evaide_admin import router as admin_user_router
from .evaide_admin.evidence_evaide_admin import router as admin_evidence_router
from .evaide_admin.note_evaide_admin import router as admin_note_router


router = APIRouter(prefix="/Evaide")

# Shared / auth
router.include_router(login_router)
router.include_router(organization_router)
router.include_router(register_router)
router.include_router(evidence_router)

# Agent
router.include_router(agent_case_router)
router.include_router(agent_evidence_router)
router.include_router(agent_note_router)

# Org Admin
router.include_router(org_case_router)
router.include_router(org_user_router)
router.include_router(org_evidence_router)
router.include_router(org_note_router)
router.include_router(org_assignment_router)

# Evaide Admin
router.include_router(admin_case_router)
router.include_router(admin_user_router)
router.include_router(admin_evidence_router)
router.include_router(admin_note_router)
