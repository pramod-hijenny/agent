# AgentCircle Backend

The app now uses InsForge as its primary backend for database, auth, storage,
and backend tasks. This Python backend directory is kept only for optional
custom API or agent-service experiments.

For product backend work, prefer the InsForge CLI and SDK patterns documented in
the repository guidelines.

## Optional Python Checks

```bash
ruff check .
pytest
```
