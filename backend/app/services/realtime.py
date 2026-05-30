from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)

    def disconnect(self, user_id: UUID, websocket: WebSocket) -> None:
        self._connections[user_id].discard(websocket)
        if not self._connections[user_id]:
            self._connections.pop(user_id, None)

    async def send_user(self, user_id: UUID, payload: dict) -> None:
        for websocket in list(self._connections.get(user_id, set())):
            await websocket.send_json(payload)

    async def broadcast(self, user_ids: list[UUID], payload: dict) -> None:
        for user_id in user_ids:
            await self.send_user(user_id, payload)


manager = ConnectionManager()
