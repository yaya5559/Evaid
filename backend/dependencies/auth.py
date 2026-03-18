from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from services.loginServices import decode_access_token
from services.database import get_db_connection

#source of truth :
#evaide admin: full system access
#org_admin: only their org's data
#agent: only their org's assigned case

_bearer = HTTPBearer(auto_error=False)

def _normalize_role(role_value: Any) -> str:
    role = str(role_value or "").strip().lower()
    if role == "admin":
        return "evaide_admin"
    if role in {"organization", "organization_admin"}:
        return "org_admin"
    return role


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    payload = decode_access_token(credentials.credentials)
    role = _normalize_role(payload.get("role"))

    return {
        "user_id": payload.get("user_id"),
        "email": payload.get("email"),
        "role": role,
        "claims": payload,
    }


def require_roles(*roles: str):
    allowed_roles = {_normalize_role(role) for role in roles}

    def _enforce(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _enforce



def get_user_org_id(user_id:int) -> int | None:
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT org_id FROM users WHERE user_id = ? AND deleted_at IS NULL", (user_id,))
        row = cur.fetchone()
        return row[0] if row else None
    
    finally:
        conn.close()

def case_belong_to_org(case_id: int, org_id: int) -> bool:
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM cases WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL", (case_id, org_id))
        return cur.fetchone() is not None
    
    finally:
        conn.close()
        