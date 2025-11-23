from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
def root():
    return {"message": "Hello from FastAPI backend!"}

@app.get("/api/example")
def example():
    return {"status": "ok", "data": [1, 2, 3]}
