from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router
from routes import evidence
<<<<<<< HEAD
=======
from routes.org_admin import assignment_org_admin
>>>>>>> origin/main
from uuid import UUID

app = FastAPI()

# Allow frontend to call backend during dev
origins = [
    "http://localhost:5173",  # Vite dev server
    # Add more origins here in future (production URL, etc.)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# temporary Cases Route for testing Evidence Upload
cases_filler = APIRouter(prefix="/cases", tags=["filler"]) 

@cases_filler.get("/all")
async def get_mock_cases():
    return [
        {
            "id": 1, 
            "description": "Test Case 1",
            "status": "pending",
            "created_at": "2026-03-10T00:00:00Z",
            "organization_id": 1
        }
    ]

app.include_router(cases_filler)
app.include_router(api_router)
app.include_router(evidence.router)

