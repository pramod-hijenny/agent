# AgentCircle Backend

Python backend for AgentCircle. It replaces the frontend prototype's `localStorage`
and mock data with real APIs for accounts, profiles, posts, discovery, intros,
chat, and agent workflows.

## Local Setup

```bash
cd backend
cp .env.example .env
docker compose up --build
```

Services:

- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Mailpit inbox: `http://localhost:8025`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

Run migrations after containers are up:

```bash
docker compose exec api alembic upgrade head
```

Load demo profiles:

```bash
docker compose exec api python -m app.db.seed
```

## Frontend Integration

Set the frontend API URL:

```bash
VITE_API_URL=http://localhost:8000
```

The frontend should replace `src/lib/store.ts` localStorage calls with calls to
the `/auth`, `/me`, `/profiles`, `/discover`, `/intros`, `/conversations`, and
`/ws` endpoints.

## Development Checks

```bash
ruff check .
pytest
```
