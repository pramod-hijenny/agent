"""FastAPI auth dependency: identify the caller from their InsForge JWT."""
from fastapi import Header, HTTPException

from . import insforge


async def get_current_user(authorization: str = Header(default="")) -> dict:
    token = authorization.removeprefix("Bearer ").removeprefix("bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    user = await insforge.verify_user(token)
    if not user or not user.get("id"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    # Carry the token so downstream DB calls run with the user's RLS context.
    return {"id": user["id"], "email": user.get("email"), "token": token}
