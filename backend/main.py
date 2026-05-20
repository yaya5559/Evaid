from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router
from contextlib import asynccontextmanager
import threading, time, os
from services.run_analysis import claim_next_analysis_run, run_analysis

origins = ["http://localhost:5173"]
extra = os.getenv("ALLOWED_ORIGIN")
if extra:
    for origin in extra.split(","):
        origins.append(origin.strip())

def worker_loop():
    while True:
        try:
            run = claim_next_analysis_run()
            if run:
                run_analysis(run["analysis_run_id"])
                time.sleep(0.5)
            else:
                time.sleep(5)
        except Exception as e:
            print(f"[Worker] Error: {e}")
            time.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    thread = threading.Thread(target=worker_loop, daemon=True)
    thread.start()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

