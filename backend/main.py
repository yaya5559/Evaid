from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router
from contextlib import asynccontextmanager
import threading, time, os
from services.run_analysis import claim_next_analysis_run, run_analysis
from services.database import init_db
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter


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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)

