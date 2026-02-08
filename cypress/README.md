To run Cypress use the following command in the terminal

npx cypress run --record --key ad796ada-aec4-4722-b0bf-d42491adf8dd

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