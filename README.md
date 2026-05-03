# Evaide
Capstone senior project

---

## Recommended: Run with Docker (no Python/Node setup needed)

Docker guarantees everyone uses the same Python 3.10.11 and Node 20 — no version mismatches.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

1. **Get the credentials file**
   Copy the example and fill in the real values (ask a teammate for credentials):
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Start in the mode you need**

   **Production mode** — frontend is pre-built, no hot reload:
   ```bash
   docker compose up --build
   ```

   **Dev mode** — frontend hot-reloads on every file save:
   ```bash
   docker compose -f docker-compose.dev.yml up
   ```

3. **Open the app**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

To stop: `docker compose down`

To rebuild after dependency changes (prod only): `docker compose up --build`

---

## Alternative: Run locally (manual setup)

If you prefer not to use Docker:

### Backend

```bash
cd backend

# Create and activate virtual environment
# Windows:
python -m venv venv
venv\Scripts\activate

# Mac/Linux:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in credentials
cp .env.example .env

# Run
uvicorn main:app --reload --port 8000
```

> Note: you must also have ODBC Driver 18 for SQL Server installed on your machine.
> Download: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:5173
