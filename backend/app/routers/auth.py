"""Passwordless-login helper. Email-only sign-in derives a deterministic password
client-side; if an email already exists with a *different* password, the client
can't sign in. This endpoint (admin key, server-side only) deletes that account so
the client can recreate it with the derived password.

⚠ FOR NOW / TESTING ONLY: this is an unauthenticated "delete account by email"
endpoint — an abuse vector. Remove or lock it down before real production.
"""
import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

_BASE = settings.insforge_base_url.rstrip("/")


class EmailBody(BaseModel):
    email: str


def _admin_headers() -> dict:
    return {"Authorization": f"Bearer {settings.insforge_api_key}", "Content-Type": "application/json"}


@router.post("/reset-email")
async def reset_email(body: EmailBody):
    email = body.email.strip().lower()
    if not email:
        return {"deleted": False, "count": 0}
    async with httpx.AsyncClient(timeout=20) as c:
        lookup = await c.get(
            f"{_BASE}/api/auth/users", params={"search": email, "limit": 50}, headers=_admin_headers()
        )
        if lookup.status_code != 200:
            return {"deleted": False, "count": 0, "detail": f"lookup {lookup.status_code}"}
        users = lookup.json().get("data", [])
        ids = [u["id"] for u in users if str(u.get("email", "")).lower() == email]
        if not ids:
            return {"deleted": False, "count": 0}
        deleted = await c.request(
            "DELETE", f"{_BASE}/api/auth/users", json={"userIds": ids}, headers=_admin_headers()
        )
        return {"deleted": deleted.status_code < 300, "count": len(ids)}
