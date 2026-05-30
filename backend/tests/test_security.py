from uuid import uuid4

from app.core.security import create_access_token, create_magic_token, decode_access_token, verify_magic_token


def test_access_token_roundtrip() -> None:
    user_id = uuid4()
    token = create_access_token(user_id)

    assert decode_access_token(token) == user_id


def test_magic_token_roundtrip() -> None:
    token = create_magic_token("User@Example.com")

    assert verify_magic_token(token) == "user@example.com"
