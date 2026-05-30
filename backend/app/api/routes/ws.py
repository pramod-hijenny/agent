from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.security import decode_access_token
from app.db.session import AsyncSessionLocal
from app.services.accounts import get_user_graph
from app.services.realtime import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query()) -> None:
    try:
        user_id = decode_access_token(token)
    except Exception:
        await websocket.close(code=4401)
        return
    async with AsyncSessionLocal() as session:
        user = await get_user_graph(session, user_id)
        if not user:
            await websocket.close(code=4401)
            return
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.send_user(user_id, {"type": "echo", "payload": data})
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
