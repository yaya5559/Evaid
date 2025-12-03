from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.auth

app = FastAPI()

# Allow frontend to call backend during dev
origins = [
    "http://localhost:5173",  # Vite dev server
    # Add more origins here in future (production URL, etc.)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/create/")
def create():
    return {}

@app.get("/test/{test_id}")
async def test(test_id):
    return {"Hello": test_id}

@app.get("/")
def root():
    return {"message": "Hello fr FastAPI backend!"}

@app.get("/api/example")
def example():
    return {"status": "ok", "data": [1, 2, 3]}
