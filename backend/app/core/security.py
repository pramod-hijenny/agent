from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.core.config import get_settings


def create_access_token(user_id: UUID) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.jwt_ttl_seconds)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> UUID:
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    return UUID(payload["sub"])


def create_magic_token(email: str) -> str:
    serializer = URLSafeTimedSerializer(get_settings().magic_link_secret)
    return serializer.dumps({"email": email.lower().strip()})


def verify_magic_token(token: str) -> str:
    settings = get_settings()
    serializer = URLSafeTimedSerializer(settings.magic_link_secret)
    try:
        data = serializer.loads(token, max_age=settings.magic_link_ttl_seconds)
    except (BadSignature, SignatureExpired) as exc:
        raise ValueError("Invalid or expired magic link") from exc
    email = data.get("email")
    if not isinstance(email, str) or "@" not in email:
        raise ValueError("Invalid magic link payload")
    return email
