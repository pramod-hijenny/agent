# AgentCircle

AgentCircle is an AI-mediated social discovery app. Users create a profile, configure an AI social representative, discover compatible people, review agent-to-agent context, and approve introductions before anything is sent.

## Stack

- Vite, React 19, and TypeScript
- Tailwind CSS v4
- shadcn-style UI components with Radix primitives
- lucide-react icons
- Bun for package management and scripts
- Lightweight client-side routing in `src/lib/navigation.tsx`
- Optional static deployment via Wrangler assets
- Python backend scaffold for real APIs, persistence, workers, and tests
- LangChain for agent persona, memory, tools, and approval-aware agent workflows
- A2A Agent Card discovery for agent interoperability

## Frontend

Application code lives in `src/`.

- `src/routes/`: file-based routes
- `src/components/`: reusable React components
- `src/components/ui/`: shadcn-style primitives
- `src/lib/`: mock data, matching logic, store, and types
- `src/hooks/`: shared hooks
- `src/styles.css`: Tailwind entry point and design tokens

## Specs

This repo uses spec-driven development docs to keep product and implementation decisions deterministic.

- `spec/mission.md`: product mission, principles, users, scope, and safety model
- `spec/task.md`: task workflow, roadmap, ready/done checklists, and launch gates
- `spec/design.md`: product architecture, technical stack, data model, design system, and UI direction

## Commands

```bash
bun install
bun run dev
bun run lint
bun run build
```

## Backend

The Python backend lives in `backend/`. See `backend/README.md` for Docker, migrations, seed data, and test commands.
