from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "agentcircle",
    broker=settings.redis_url,
    backend=settings.redis_url,
)


@celery_app.task(name="agentcircle.agent_workflow")
def agent_workflow_task(thread_id: str, state: dict) -> dict:
    from app.agents.workflows import start_agent_workflow

    return start_agent_workflow(thread_id, state)
