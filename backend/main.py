from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router
from contextlib import asynccontextmanager
import threading, time
from services.run_analysis import claim_next_analysis_run, run_analysis
from services.database import init_db



# Allow frontend to call backend during dev
origins = [
    "http://localhost:5173",  # Vite dev server
    # Add more origins here in future (production URL, etc.)
]


def worker_loop():
    while True:
        try:
            run = claim_next_analysis_run()
            if run:
                run_analysis(run["analysis_run_id"])
            else:
                time.sleep(5)
        except Exception as e:
            print(f"[Worker] Error: {e}")
            time.sleep(5)
        else:
            if run:
                time.sleep(0.5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db(pool_size=5)
    thread = threading.Thread(target=worker_loop, daemon=True)
    thread.start()
    yield

app = FastAPI(lifespan=lifespan)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)

