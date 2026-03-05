from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router
from routes import evidence

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

app.include_router(api_router)