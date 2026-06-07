"""GetMyBee agent backend — FastAPI on InsForge compute.

Four pillars (Registry / Discovery / Interaction / Trust) + Interview, with an
LLM invoked at bounded points and humans approving every meaningful action.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import agent_network, agents, auth, discovery, interviews, messages

app = FastAPI(title="GetMyBee Agent API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"}),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(discovery.router)
app.include_router(messages.router)
app.include_router(interviews.router)
app.include_router(agent_network.router)
