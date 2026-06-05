"""Thin async client for the InsForge REST API (PostgREST-style + auth + RPC).

No Python SDK exists, so we talk to InsForge over HTTP with httpx (per spec §4.1):
- tables: /api/database/records/{table}  (filters like col=eq.value)
- rpc:    /api/database/rpc/{fn}
- auth:   /api/auth/sessions/current

Pass the caller's user JWT for RLS-scoped operations; pass the service API key
(settings.insforge_api_key) only for privileged operations.
"""
import httpx

from .config import settings

_BASE = settings.insforge_base_url.rstrip("/")
DB = f"{_BASE}/api/database/records"
RPC = f"{_BASE}/api/database/rpc"
AUTH = f"{_BASE}/api/auth"


def _headers(token: str, prefer: str | None = None) -> dict:
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    return h


async def verify_user(token: str) -> dict | None:
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"{AUTH}/sessions/current", headers=_headers(token))
    if r.status_code != 200:
        return None
    data = r.json()
    return data.get("user") or (data.get("data") or {}).get("user")


async def select(table: str, params: dict, token: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{DB}/{table}", params=params, headers=_headers(token))
    r.raise_for_status()
    return r.json()


async def insert(table: str, rows: list[dict], token: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(f"{DB}/{table}", json=rows, headers=_headers(token, "return=representation"))
    r.raise_for_status()
    return r.json()


async def update(table: str, params: dict, patch: dict, token: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.patch(
            f"{DB}/{table}", params=params, json=patch, headers=_headers(token, "return=representation")
        )
    r.raise_for_status()
    return r.json()


async def rpc(fn: str, body: dict, token: str):
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(f"{RPC}/{fn}", json=body, headers=_headers(token))
    r.raise_for_status()
    return r.json()
