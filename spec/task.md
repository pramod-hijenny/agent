# Task Spec

## Purpose

This file is the execution plan for the spec-driven app. It turns the mission and design into small, verifiable tasks, and it replaces a separate roadmap file so the spec folder stays focused.

Use this file before changing code. Each task should have a named user journey, clear scope, known data boundaries, explicit safety behavior, and verification steps.

## Current Focus

Build AgentCircle into a production-ready prototype for AI-mediated startup-community networking. The first complete workflow is: join a trusted startup community, state who you need to meet, receive three useful matches with explanations, review an agent-generated intro draft, approve sending, and track the intro lifecycle with backend-enforced permissions.

## Spec-Driven Workflow

Before building a feature:

1. Update `spec/mission.md` if the product purpose, user promise, target user, or safety model changes.
2. Update `spec/design.md` if the architecture, UI stack, data model, API shape, or design system changes.
3. Update this file if the work changes scope, priority, acceptance criteria, or launch readiness.
4. Write or update the relevant types, API contracts, fixtures, and acceptance checks.
5. Implement the smallest coherent slice.
6. Verify with lint, build, backend tests when relevant, and manual browser checks for UI work.

## Task Selection Rules

- Prefer the highest unfinished phase in the roadmap below.
- Keep each task small enough to implement, review, and verify in one coherent change.
- Do not add frameworks, services, data stores, or major dependencies without updating `spec/design.md`.
- Do not ship permission-sensitive behavior without backend validation or an explicit documented prototype limitation.
- Keep checked items checked only when code, docs, and verification are complete.

## Ready Checklist

A task is ready when:

- The user journey is named.
- The affected routes, components, services, and data types are known.
- The data source is clear: frontend mock state, backend API, or future API contract.
- Loading, empty, error, success, disabled, and permission-blocked states are described when relevant.
- Permission and safety behavior is explicit.
- Acceptance criteria are testable.

## Done Checklist

A task is done when:

- The implemented behavior matches `spec/mission.md` and `spec/design.md`.
- The UI has no dead primary actions unless intentionally disabled.
- New or changed data boundaries are typed.
- Sensitive actions preserve human approval requirements.
- AI-generated content is labeled.
- `bun run lint` passes for frontend changes.
- `bun run build` passes for frontend changes.
- Backend tests pass for touched backend behavior.
- README or spec docs are updated when behavior, setup, scope, or architecture changes.

## Task Template

```md
## Task

Name:
Roadmap phase:
User journey:

### Goal

What should be true after this task?

### Scope

In:

-

Out:

-

### Affected Files

-

### Data And Permissions

- Data source:
- Typed contracts:
- Permission gates:
- AI labeling:

### Acceptance Criteria

- [ ]

### Verification

- [ ] `bun run lint`
- [ ] `bun run build`
- [ ] Backend tests, if backend behavior changed
- [ ] Manual browser check, if UI changed
```

## Roadmap

### Phase 0: Repo Hygiene And Deterministic Specs

Goal: make the project easier to reason about before adding more features.

- [x] Create `spec/mission.md`.
- [x] Create `spec/task.md`.
- [x] Create `spec/design.md`.
- [x] Link the spec folder from `README.md`.
- [x] Rename generic starter metadata to the product name.
- [x] Replace the previous app framework with plain React + Vite.
- [x] Consolidate specs into mission, task, and design.
- [ ] Choose one canonical product name across UI, package metadata, README, backend, and deploy config.
- [ ] Document all frontend and backend environment variables in `spec/design.md`.
- [ ] Add a PR checklist or contributor checklist for spec-driven changes.
- [ ] Add a repeatable local setup path for frontend plus backend.

Acceptance criteria:

- New contributors can understand the product, architecture, and roadmap from `README.md` plus `spec/`.
- Future feature requests can be mapped to a roadmap phase.
- The spec folder has only `mission.md`, `task.md`, and `design.md`.

### Phase 1: Frontend Prototype Hardening

Goal: turn the current mock-data UI into a reliable demo-quality app for the startup-community MVP.

- [x] Audit landing, auth, onboarding, home, discover, agent, inbox, connections, profile, and settings routes against the focused mission.
- [x] Remove or disable first-MVP dating, travel, friendship, feed-first posting, photos, likes, comments, and shares.
- [x] Add startup-community language across landing, onboarding, home, discover, profile, agent, inbox, and settings.
- [x] Add a demo startup community and community context to mock state.
- [x] Replace broad social seed data with focused founder, builder, mentor, investor, operator, and customer scenarios.
- [x] Expand seed data to 8 to 12 high-quality startup-community profiles.
- [ ] Add empty, loading, error, success, disabled, and permission-blocked states for primary routes.
- [ ] Replace dead controls with working behavior or intentional disabled states.
- [ ] Add validation for onboarding forms, including community, role, skills, current ask, and availability.
- [ ] Add validation for profile editing.
- [ ] Add validation for agent settings and memory editing.
- [ ] Add validation for intro approval and intro message editing.
- [ ] Normalize AI labels across agent notes, drafts, transcripts, and recommendations.
- [ ] Normalize permission wording across onboarding, agent settings, and safety notices.
- [ ] Verify mobile layouts for landing, home, discover, inbox, and profile.
- [ ] Add a local demo reset command.
- [ ] Decide whether to add a frontend test runner now or defer until backend integration.

Acceptance criteria:

- A first-time user can complete startup-community onboarding without confusing dead ends.
- The app clearly communicates the "find three useful people" promise.
- Every primary button either performs an action or is clearly unavailable.
- The app works at desktop and mobile breakpoints.
- Demo data can be reset to a known state.

### Phase 2: Backend Integration

Goal: replace localStorage and mock-only behavior with real API-backed state.

- [ ] Define typed API contracts for auth, current user, communities, memberships, profiles, discovery, intros, conversations, and agent settings.
- [x] Add a frontend API client layer under `src/lib/api/`.
- [ ] Add typed API hooks for server-backed frontend state.
- [ ] Replace localStorage user state with backend `/me` state.
- [ ] Replace mock profile reads with backend profile endpoints.
- [x] Add backend endpoints for authenticated community and membership reads.
- [x] Replace mock discovery with a community-scoped backend discovery endpoint when `VITE_API_URL` is configured.
- [ ] Replace local intro creation with backend intro endpoints.
- [ ] Keep seed fixtures available for demo and test mode.
- [ ] Add server validation for profile updates.
- [ ] Add server validation for agent permission updates.
- [ ] Add server validation for intro messages.
- [ ] Add consistent backend error response shapes.
- [x] Add basic frontend error handling for failed auth, discovery, onboarding, and intro API calls.

Acceptance criteria:

- Refreshing the browser does not lose user, profile, intro, or agent state.
- Backend is the source of truth for permission-sensitive actions.
- Frontend handles API errors without crashing.
- Seed data can populate a repeatable startup-community demo.

### Phase 3: Authentication And Account Readiness

Goal: make sign-in, session handling, and account ownership realistic.

- [ ] Choose the prototype auth strategy.
- [ ] Implement sign up.
- [ ] Implement sign in.
- [ ] Implement logout.
- [ ] Persist sessions across browser refresh.
- [ ] Protect `/app/*` routes.
- [ ] Add onboarding completion state.
- [ ] Add active community selection state.
- [x] Add backend membership checks for community-scoped profile search, profile reads, and discovery.
- [ ] Add backend ownership checks for profile mutations.
- [ ] Add backend ownership checks for agent mutations.
- [ ] Add backend ownership checks for intro and conversation access.
- [ ] Add demo account reset or account deletion behavior.

Acceptance criteria:

- Unauthenticated users cannot access app routes.
- Users can sign in, refresh, and remain authenticated.
- Users cannot edit another user's profile, agent, intros, or conversations.
- Onboarding state determines where a newly authenticated user lands.

### Phase 4: Matching And Agent Workflow

Goal: make community-scoped recommendations explainable, testable, and safe.

- [ ] Move canonical matching logic to the backend.
- [ ] Keep deterministic scoring rules documented and tested.
- [ ] Return structured match explanation objects from the API.
- [x] Add tests for community-oriented matching behavior.
- [ ] Add route tests for community membership filtering.
- [ ] Add tests for role-fit scoring.
- [ ] Add tests for skill and need complement scoring.
- [ ] Add tests for goal matching.
- [ ] Add tests for shared-interest scoring.
- [ ] Add tests for blocked topics and sensitive permissions.
- [ ] Ensure the default discovery endpoint returns three useful matches unless the caller requests a different limit.
- [ ] Store generated agent transcript summaries.
- [ ] Store intro draft metadata.
- [ ] Add an agent workflow interface for future LLM-backed behavior.
- [ ] Defer LangChain persona prompt loading until deterministic matching and intro workflows are complete.
- [ ] Defer A2A agent discovery until community-scoped matching proves useful.
- [ ] Ensure LLM or template output never bypasses permission gates.

Acceptance criteria:

- Same inputs produce the same match order in tests.
- Users can see why each match was recommended.
- Discovery only returns people from communities the user can access.
- Contact sharing is blocked unless permission checks pass.

### Phase 5: Trust, Safety, And Auditability

Goal: make the prototype credible around user control.

- [ ] Add an audit event model.
- [ ] Log agent recommendations.
- [ ] Log agent transcript generation.
- [ ] Log intro draft creation.
- [ ] Log user approval, rejection, acceptance, cancellation, and contact-sharing actions.
- [ ] Add explicit intro lifecycle states.
- [x] Add backend intro lifecycle transition rules for sender withdrawal and recipient accept/reject.
- [ ] Add block user behavior.
- [ ] Add report user behavior.
- [ ] Add rate limits for intro requests.
- [ ] Add rate limits for agent simulations.
- [ ] Add "why am I seeing this?" UI for matches.
- [ ] Add "what did my agent share?" UI for agent interactions.
- [ ] Add membership-boundary checks to prevent cross-community profile leakage.

Acceptance criteria:

- Every intro can be traced to user approval or user permission.
- Users can inspect what an agent said before approval.
- Blocked users do not appear in discovery or inbox flows.
- Sensitive data is never included in match cards by default.

### Phase 6: Production Prototype Operations

Goal: make the app deployable, observable, and recoverable.

- [ ] Define local environment config.
- [ ] Define preview environment config.
- [ ] Define production prototype environment config.
- [ ] Add CI for frontend lint.
- [ ] Add CI for frontend build.
- [ ] Add CI for backend tests.
- [ ] Add CI for backend lint.
- [ ] Add migration check in CI.
- [ ] Add backend structured logging.
- [ ] Add request IDs.
- [ ] Add frontend error capture.
- [ ] Add backend error capture.
- [ ] Add API health checks.
- [ ] Add database, Redis, and worker health checks.
- [ ] Document deployment steps.
- [ ] Document rollback steps.

Acceptance criteria:

- A clean machine can run the app from documented commands.
- CI blocks broken builds.
- Preview deployments are possible before production deploys.
- Health endpoints show whether core services are reachable.

### Phase 7: Demo Readiness

Goal: make the app reliable for investor, customer, or internal demos.

- [ ] Create one polished demo account.
- [ ] Seed 8 to 12 high-quality startup-community profiles.
- [ ] Add demo scenario for cofounder discovery.
- [ ] Add demo scenario for mentor discovery.
- [ ] Add demo scenario for investor or advisor discovery.
- [ ] Add demo scenario for customer/design-partner discovery.
- [ ] Add demo scenario for operator or hiring-adjacent networking without making hiring claims.
- [ ] Add a one-command demo reset script.
- [ ] Add screenshots or walkthrough notes to the README.
- [ ] Rehearse the five-minute demo path and fix rough edges.

Acceptance criteria:

- The demo can be reset in under one minute.
- The "find three useful people" story can be shown in under five minutes.
- There are no broken primary flows during the demo path.

## Launch Gate

- [ ] Product mission matches implemented behavior.
- [ ] User permissions are enforced on the backend.
- [ ] AI-generated content is labeled.
- [ ] Auth and route protection work.
- [ ] Data persists outside localStorage.
- [ ] Seed data is realistic and repeatable.
- [ ] Frontend lint passes.
- [ ] Frontend build passes.
- [ ] Backend tests pass.
- [ ] Backend lint passes.
- [ ] Known risks are documented.
- [ ] Deployment instructions exist.
- [ ] Rollback instructions exist.
