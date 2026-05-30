from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.email import send_magic_link
from app.core.security import create_access_token, create_magic_token, verify_magic_token
from app.core.config import get_settings
from app.db.session import get_session
from app.schemas import MagicLinkRequest, MagicLinkVerify, TokenResponse
from app.services.accounts import get_or_create_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-link")
async def request_link(payload: MagicLinkRequest) -> dict[str, str]:
    token = create_magic_token(payload.email)
    send_magic_link(payload.email, token)
    return {"status": "sent"}


@router.post("/verify", response_model=TokenResponse)
async def verify(payload: MagicLinkVerify, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    try:
        email = verify_magic_token(payload.token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    user = await get_or_create_user(session, email)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(
    payload: MagicLinkRequest, session: AsyncSession = Depends(get_session)
) -> TokenResponse:
    if get_settings().app_env == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    user = await get_or_create_user(session, payload.email)
    return TokenResponse(access_token=create_access_token(user.id))
