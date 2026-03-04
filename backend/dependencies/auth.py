from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.loginServices import decode_access_token

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
