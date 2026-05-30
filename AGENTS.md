# Repository Guidelines

## Project Structure & Module Organization

This is a React app built with Vite, Tailwind CSS, shadcn-style UI primitives, and Bun. Application code lives in `src/`.

- `src/App.tsx`: lightweight client-side route composition.
- `src/main.tsx`: Vite React entry point.
- `src/routes/`: route screen components such as `app.home.tsx`, `app.profile.$id.tsx`, and `onboarding.tsx`.
- `src/components/`: reusable app components; shared Radix-style primitives are in `src/components/ui/`.
- `src/lib/`: domain logic, mock data, navigation, utilities, types, and error handling.
- `src/hooks/`: shared React hooks.
- `src/styles.css`: global Tailwind CSS entry point.
- `spec/`: deterministic product and technical specs, including mission, roadmap TODOs, and stack decisions.

## Build, Test, and Development Commands

Use Bun because this repo includes `bun.lock`.

- `bun install`: install dependencies.
- `bun run dev`: start the local Vite development server.
- `bun run build`: create a production build.
- `bun run build:dev`: build using development mode.
- `bun run preview`: preview the built app locally.
- `bun run lint`: run ESLint across the repository.
- `bun run format`: run Prettier with write mode.

## Coding Style & Naming Conventions

Write TypeScript and React in `.ts` and `.tsx` files. Prefer functional components and hooks. Use PascalCase for component files and exports, such as `AgentCard.tsx`, and camelCase for functions, variables, and hooks, such as `useMobile`.

Formatting is managed by Prettier via `bun run format`; linting is managed by ESLint in `eslint.config.js`. Keep imports compatible with the configured `@` path alias. Do not import Next.js-only packages such as `server-only`, and do not add a heavier app framework without first updating `spec/design.md`.

## Testing Guidelines

No dedicated test framework or test script is currently configured. Before opening a change, run `bun run lint` and `bun run build`. For new tests, place them near the code they cover using `ComponentName.test.tsx` or `libName.test.ts`, and add the script to `package.json`.

## Commit & Pull Request Guidelines

This working directory does not include Git history, so project-specific commit conventions are not available. Use concise, imperative commit messages, for example `Add onboarding permission toggle` or `Fix match score formatting`.

Pull requests should include a short summary, verification steps, and screenshots or recordings for UI changes. Link related issues when available, and call out routing, Cloudflare, or generated-file changes.

## Security & Configuration Tips

Keep secrets out of source files. Use environment variables for runtime configuration and review `wrangler.jsonc` before deployment-related changes. Avoid editing generated or build output directories such as `dist`, `.output`, and `.vinxi`.
