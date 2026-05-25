# Evaide Backend Setup with Database

## Setup Instructions

### Windows
```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

### Mac
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

This installs ODBC Driver (until I figure out sqlalchemy + pymssql), creates virtual environment, and installs all packages.

---

## Run the App

```bash
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Mac:
source venv/bin/activate

# Start server
uvicorn main:app --reload
```

Open: http://127.0.0.1:8000/docs

---

## Test Login

**Default credentials:**
- Email: `admin@evaide.com`
- Password: `dAtAbaS3w0rk!?,`

---

## Daily Workflow

```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Mac
uvicorn main:app --reload
```

Stop: `Ctrl + C`


secure=False on refresh token cookie — auth.py sets secure=False, so the cookie is sent over plain HTTP. Fine for localhost, must be True in production.