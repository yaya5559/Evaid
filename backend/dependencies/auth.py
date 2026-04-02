<<<<<<< HEAD
﻿from typing import Any
=======
from typing import Any
>>>>>>> origin/main
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from services.loginServices import decode_access_token
from services.database import get_db_connection
from uuid import UUID

<<<<<<< HEAD
#source of truth :
#evaide admin: full system access
#org_admin: only their org's data
#agent: only their org's assigned case
=======
# Source of truth:
# evaide_admin: full system access
# org_admin: only their org's data
# agent: only their org's assigned case
>>>>>>> origin/main

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


<<<<<<< HEAD

def get_user_org_id(user_id:int) -> int | None:
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT org_id FROM users WHERE user_id = ? AND deleted_at IS NULL", (user_id,))
        row = cur.fetchone()
        return row[0] if row else None
    
    finally:
        conn.close()

def case_belong_to_org(case_id: UUID, org_id: int) -> bool:
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM cases WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL", (case_id, org_id))
        return cur.fetchone() is not None
    
    finally:
        conn.close()
        

=======
def get_user_org_id(user_id: int) -> int | None:
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT org_id FROM users WHERE user_id = ? AND deleted_at IS NULL",
            (user_id,),
        )
        row = cur.fetchone()
        return row[0] if row else None

    finally:
        cur.close()   
        conn.close()


def case_belong_to_org(case_id: int, org_id: int) -> bool:
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT 1 FROM cases WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL",
            (case_id, org_id),
        )
        return cur.fetchone() is not None
    finally:
        cur.close()   
        conn.close()


def verify_dynamic_access(case_id: int, current_user: dict) -> bool:
    role = current_user.get("role")
    user_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")

    if role == "evaide_admin":
        return True

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Organizational Ownership
        cur.execute(
            "SELECT 1 FROM Cases WHERE case_id = ? AND org_id = ? AND deleted_at IS NULL",
            (case_id, org_id)
        )
        if cur.fetchone():
            if role == "org_admin":
                return True
        else:
            if role != "agent":
                return False

        # Direct Agent Assignment
        if role == "agent":
            cur.execute(
                "SELECT 1 FROM case_assignments WHERE case_id = ? AND user_id = ?",
                (case_id, user_id)
            )
            if cur.fetchone():
                return True

            # AI Dynamic Access (Using the Graph MATCH syntax)
            # This tells SQL to handle the hex columns so you don't get 'Internal' errors
            link_query = """
                SELECT 1
                FROM Evidence AS e_target, EvidenceLink AS el, Evidence AS e_source, case_assignments AS ca
                WHERE MATCH(e_source-(el)->e_target)
                  AND e_source.case_id = ca.case_id
                  AND e_target.case_id = ?
                  AND ca.user_id = ?
            """
            cur.execute(link_query, (case_id, user_id))
            return cur.fetchone() is not None

        return False
    except Exception as e:
        print(f"Graph Logic Error: {e}")
        return False
    finally:
        cur.close()
        conn.close()
>>>>>>> origin/main
