from uuid import UUID

import httpx
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import decode_access_token
from app.db.session import get_session
from app.models import User
from app.services.accounts import get_or_create_user


async def get_current_user(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    settings = get_settings()
    if settings.app_env != "production" and token == "demo-agentcircle-local":
        return await get_or_create_user(session, "demo@agentcircle.app")
    try:
        user_id: UUID = decode_access_token(token)
    except Exception:
        return await get_current_insforge_user(token, session)

    user = await session.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_insforge_user(token: str, session: AsyncSession) -> User:
    settings = get_settings()
    if not settings.insforge_url:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    url = f"{settings.insforge_url.rstrip('/')}/api/auth/sessions/current"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers={"Authorization": f"Bearer {token}"})
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate InsForge session",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    payload = response.json()
    user_payload = payload.get("user") or payload.get("data", {}).get("user") or payload
    email = user_payload.get("email") if isinstance(user_payload, dict) else None
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="InsForge session has no email",
        )
    return await get_or_create_user(session, email)
