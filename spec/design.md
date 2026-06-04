# Design Spec

## Purpose

This file defines the product architecture, technical architecture, design-system stack, and experience rules needed to achieve the mission in `spec/mission.md`.

It intentionally includes both product design and technical design so the spec folder stays focused on three files: mission, task, and design.

## Mission-To-Design Requirements

The mission creates six hard design requirements:

1. Focus on startup-community networking.
   Every core screen should support founders, builders, operators, mentors, investors, and community members finding useful introductions inside trusted networks.

2. Reduce networking friction.
   Discovery, match review, intro drafting, and approval must be faster and higher-context than manual directory search, Slack browsing, or cold outreach.

3. Preserve human control.
   Users must always know what their agent can do, what it has drafted, and what requires approval.

4. Make trust visible.
   Match reasoning, AI labels, permission states, and intro lifecycle states must be visible in the interface.

5. Keep consent central.
   Contact sharing, intro sending, scheduling, and agent-generated messages must remain gated by explicit permission.

6. Support deterministic development.
   UI and backend behavior must be driven by typed data, explicit states, reusable components, stable contracts, and tests.

## Product Architecture

AgentCircle is designed as six connected product surfaces:

1. Identity, community, and onboarding.
   Users create an account, join or select a startup community, define their human profile, select goals and skills, configure an agent persona, and review permissions.

2. Agent control center.
   Users manage the agent mission, tone, memory, status, and permission boundaries.

3. Community-scoped discovery and matching.
   Users describe who they want to meet inside a trusted community, then inspect a small ranked set of useful matches with score explanations and shared context.

4. Agent review and intro approval.
   Users preview agent-to-agent compatibility context, edit a drafted intro, approve or reject sending, and preserve an audit trail.

5. Inbox and connections.
   Users track pending intros, accepted connections, rejected intros, completed actions, and follow-up conversations.

6. Community admin review.
   Later, community managers inspect aggregate activation, intro volume, match quality, and safety signals without reading private messages.

Current route mapping:

- Landing and auth: `src/routes/index.tsx`, `src/routes/auth.tsx`
- Onboarding: `src/routes/onboarding.tsx`
- App shell: `src/components/AppLayout.tsx`
- Home: `src/routes/app.home.tsx`
- Discover: `src/routes/app.discover.tsx`
- Agent settings: `src/routes/app.agent.tsx`
- Inbox: `src/routes/app.inbox.tsx`
- Connections: `src/routes/app.connections.tsx`
- Profile: `src/routes/app.profile.$id.tsx`
- Settings: `src/routes/app.settings.tsx`

## Technical Stack

### Frontend

- Runtime and package manager: Bun
- Build tool: Vite
- App framework: React 19 with a plain Vite SPA entry
- Routing: lightweight client-side router in `src/lib/navigation.tsx`
- UI language: TypeScript and React components
- Styling: Tailwind CSS v4
- UI primitives: shadcn-style components backed by Radix UI
- Icons: lucide-react
- Notifications: sonner
- Charts: recharts, only when comparison or trend views need them
- Deployment target: static Vite build, optionally served by Wrangler assets

### Backend

Chosen MVP backend:

- AgentCircle uses InsForge as the source of truth for database, auth, storage, and backend tasks.
- Community, membership, profile, discovery, intro, permission, feed, and audit data live in InsForge Postgres.
- Custom Python services are optional experiments, not the default MVP backend path.
- Neo4j or another graph database is not part of the MVP. Relationship data should be modeled in Postgres first.

- Backend platform: InsForge
- Database target: InsForge Postgres
- Storage target: InsForge Storage
- Migrations: InsForge CLI migrations
- Optional custom services: Python FastAPI
- Agent framework: LangChain 1.x for persona, memory, tools, and structured output
- Agent discovery protocol: A2A Agent Card at `/.well-known/agent-card.json`, future/advanced unless needed by the deterministic MVP

### Dependency Policy

Add a dependency only when it removes meaningful complexity, is maintained, fits the architecture, avoids duplicating an existing dependency, and is documented here when it affects architecture.

Avoid:

- Next.js-only packages.
- Heavy app frameworks unless this spec explicitly reopens that decision.
- Large UI frameworks that conflict with shadcn, Radix, or Tailwind.
- Client-only state libraries before typed API hooks plus local component state are exhausted.
- Advanced orchestration frameworks for the main path until the product needs branching workflows, subagents, or long-running planning.

## Frontend Architecture

Recommended structure:

- `src/routes/`: route entry points and route-level data requirements
- `src/App.tsx`: route selection and app shell composition
- `src/lib/navigation.tsx`: lightweight navigation primitives
- `src/components/`: product components
- `src/components/ui/`: reusable shadcn-style primitives
- `src/lib/api/`: API clients, fetch helpers, and generated or handwritten contract types
- `src/lib/domain/`: pure domain helpers such as display formatting and permission labels
- `src/lib/fixtures/`: demo data used in local mock mode only
- `src/hooks/`: shared hooks
- `src/styles.css`: global Tailwind imports and design tokens

Rules:

- Route files should compose screens, not hold deep business logic.
- Permission-sensitive behavior should come from backend state.
- Components should receive typed props and avoid reaching into localStorage directly.
- Keep UI primitives generic and product components domain-specific.
- Frontend may optimistically update, but it must reconcile with server responses.

## Backend Architecture

Recommended structure:

- `backend/app/api/routes/`: HTTP and websocket routes
- `backend/app/services/`: domain services and transaction-oriented business logic
- `backend/app/agents/`: deterministic agent workflows and eventual LLM integration points
- `backend/app/models.py`: database models
- `backend/app/schemas.py`: API schemas
- `backend/app/core/`: config, security, email, observability
- `backend/app/db/`: session, migrations, seed helpers
- `backend/tests/`: service, route, permission, and workflow tests

Rules:

- Backend owns authorization, permission checks, and intro lifecycle transitions.
- Agent workflows should be replayable from stored inputs for auditability.
- Server responses should use stable schema objects rather than UI-shaped strings only.
- LLM or template output must never bypass permission gates.

## Data Model And API Contracts

Use explicit TypeScript and Python schema definitions with matching names until OpenAPI generation is introduced.

Target contracts:

- `AuthSession`
- `CurrentUser`
- `Community`
- `Membership`
- `CommunityRole`
- `Profile`
- `AgentPersona`
- `Permissions`
- `DiscoveryQuery`
- `MatchResult`
- `MatchExplanation`
- `IntroRequest`
- `IntroDraft`
- `Conversation`
- `AgentTranscript`
- `A2AAgentCard`
- `A2AAgentSkill`
- `CommunityAdminSummary`
- `AuditEvent`

Minimum production-prototype tables:

- `users`
- `communities`
- `memberships`
- `profiles`
- `agent_personas`
- `agent_memories`
- `a2a_agent_cards`
- `a2a_agent_skills`
- `a2a_conversations`
- `permissions`
- `matches` or `match_events`
- `intro_requests`
- `agent_transcripts`
- `conversations`
- `conversation_messages`
- `audit_events`
- `blocks`

Important constraints:

- One user owns one primary profile for the prototype.
- Each profile owns one primary agent persona.
- Discovery is scoped to one active community by default.
- Profiles can belong to multiple communities through memberships.
- Intro requests have explicit lifecycle status.
- Agent-generated messages store metadata marking them as AI-generated.
- Audit events store actor, action, resource, timestamp, and relevant policy result.

## Safety And Permission Flow

Permission-sensitive actions should follow this path:

1. User intent is captured.
2. UI checks whether the action appears allowed, blocked, or approval-required.
3. Backend validates ownership, permission, and policy.
4. User reviews AI-generated content before sending.
5. The action creates or updates an auditable record.
6. UI shows the final lifecycle state.

Sensitive behavior:

- Contact sharing requires explicit permission.
- Autonomous sending is off by default.
- Dating and romance are out of first-MVP scope.
- Investment, fundraising, hiring, legal, medical, and financial claims must be handled conservatively and never generated as endorsements.
- Contact fields must not appear in match results unless policy and permission allow them.

## AI And Agent Strategy

Start deterministic:

- Matching should use explicit scoring rules.
- Agent transcripts can be generated from templates and stored facts.
- Intro drafts can use deterministic templates with user-editable copy.
- The golden path should return three useful matches for a community-scoped intent before adding advanced agent autonomy.

Add LLMs later only behind stable interfaces:

- `generate_agent_transcript(input) -> AgentTranscript`
- `summarize_match(input) -> MatchSummary`
- `draft_intro(input) -> IntroDraft`

LLM output requirements:

- Validate output shape.
- Store prompts or prompt version IDs.
- Store generated content metadata.
- Label generated content in the UI.
- Never bypass permission gates.
- Always allow user review for sensitive actions.

## Design System

Use the current frontend stack for the design system:

- Global tokens: `src/styles.css`
- Product components: `src/components/`
- Shared UI primitives: `src/components/ui/`
- Component primitives: shadcn-style components and Radix UI
- Icons: lucide-react
- Feedback: sonner

Design-system rules:

- Keep shadcn-style primitives generic.
- Put product behavior in domain components such as `AgentCard`, `MatchCard`, `PermissionToggle`, and `IntroApprovalModal`.
- Use Tailwind tokens and CSS variables from `src/styles.css` instead of one-off colors.
- Use lucide-react icons for common actions.
- Agent-generated content must have a consistent badge.
- Permission-sensitive controls must be visually clear.
- Destructive or sensitive actions need confirmation or clear disabled states.
- Layouts must work on mobile and desktop.

## Experience Architecture

Authenticated navigation should support repeat use:

- Home: status, approvals, and recommended next actions.
- Community: active network context, membership status, and trusted scope.
- Discover: find and evaluate three useful people inside the active community.
- Inbox: review intro requests and lifecycle status.
- Connections: accepted intros and active relationships.
- Agent: mission, memory, tone, and permissions.
- Profile and settings: human profile, account, privacy, and safety controls.

## Visual Direction

AgentCircle should feel like a focused networking operating tool for startup communities, not a generic dating app, feed-based social network, CRM, or AI novelty product.

- Use a clean, modern interface with restrained surfaces and strong hierarchy.
- Prefer dense, scannable layouts inside authenticated routes.
- Use cards for repeated items such as matches, intros, profiles, and activity entries.
- Avoid cards inside cards.
- Keep border radius modest and consistent with existing shadcn-style components.
- Keep typography compact in dashboards, lists, sidebars, and settings.
- Use color to distinguish status, safety, match strength, and action priority.
- Avoid one-note palettes and decorative backgrounds that compete with decision-making.

## Layout Rules

- Authenticated routes should put the core workflow in the first viewport.
- Every route should have a clear title, primary action, and compact supporting context.
- Lists should expose enough metadata for users to decide what to open next.
- Forms should group related fields and show validation near the relevant input.
- Mobile layouts must keep primary actions reachable and avoid horizontal overflow.
- Buttons and controls must maintain stable dimensions across loading and dynamic content.
- Use empty, loading, error, disabled, approval-required, and success states as designed states.

## Core Screen Requirements

### Landing And Auth

- State the product promise clearly.
- Make startup-community networking the first-viewport message.
- Explain that agents assist users but do not impersonate them.
- Keep sign in and sign up direct.
- Avoid implying full autonomy.

### Onboarding

- Collect community, profile, role, skills, goals, availability, agent tone, and permissions in a guided sequence.
- Make conservative permission defaults visible.
- Explain what the agent can do before activation.
- End with a clear activated, paused, or needs-review agent state.

### Home

- Surface active community, agent status, pending approvals, recommended matches, and recent intro activity.
- Make active, paused, and needs-review states visually distinct.
- Prioritize tasks requiring human decision.
- Do not make a public content feed the primary screen.

### Discover

- Support natural-language intent and structured match evidence.
- Return a small set of matches, starting with three useful people.
- Show score, score explanation, role fit, skills, shared goals, community context, availability, and next actions.
- Give users a clear path to inspect agent compatibility before requesting an intro.
- Never expose contact details from match results unless policy and permissions allow it.

### Agent Review

- Distinguish generated agent context from human-authored content.
- Show what each agent compared: goals, interests, constraints, location, and intent.
- Present the intro draft as editable text requiring user approval.
- Preserve reject and cancel paths as first-class options.

### Profile

- Separate public human profile details from private account or contact data.
- Emphasize startup role, company, skills, current ask, what the user can help with, availability, and community memberships.
- Show the agent persona separately from the human profile.
- Make edit actions clear without making private fields appear public.

### Agent Settings

- Separate mission, memory, tone, status, and permissions.
- Make dangerous or sensitive capabilities visibly gated.
- Provide clear pause and resume controls.
- Let users edit or delete agent memory.

### Inbox And Connections

- Separate pending approvals, received requests, accepted intros, rejected intros, and active conversations.
- Show lifecycle status and the last meaningful action.
- Keep AI-generated drafts and summaries labeled.

### Community Admin

- Show aggregate activation, discovery usage, intro volume, acceptance rate, and safety signals.
- Do not expose private agent memory, private messages, or hidden contact data.

## Component Architecture

- `AgentCard`: shows agent status, mission, tone, and permission summary.
- `MatchCard`: shows target profile, score, structured reasons, shared traits, and intro action state.
- `MatchScoreBadge`: communicates match strength without implying certainty.
- `PermissionToggle`: shows allowed, blocked, and approval-required states.
- `IntroApprovalModal`: supports review, edit, approve, reject, cancel, loading, and error states.
- `ActivityTimeline`: distinguishes human actions, agent-generated actions, and system events.
- `SafetyNotice`: explains consent, contact sharing, approval requirements, or blocked actions near the relevant workflow.
- `AiBadge`: labels generated recommendations, summaries, drafts, and transcripts.

Component rules:

- Components receive typed props.
- Components do not reach directly into localStorage.
- Product components may compose UI primitives, but UI primitives should not know product rules.
- Permission-sensitive components must support blocked and approval-required states.

## Content Rules

- Label AI-generated summaries, drafts, recommendations, and agent conversations.
- Use plain language for permissions.
- Avoid overstating what the agent has done.
- Explain matches with specific evidence, not vague confidence language.
- Use startup-community language: community, members, founders, builders, mentors, investors, customers, operators, skills, goals, and intros.
- Put safety and consent language near sensitive actions.
- Avoid copy that implies the AI can send, schedule, or share contact details without approval.

## Auth, Environment, And Deployment

Auth target:

- Use secure sessions.
- Protect all `/app/*` routes.
- Validate all server mutations.
- Hash passwords if email/password auth is used.
- Add CORS rules intentionally.
- Rate-limit auth and intro endpoints.

Environment variables:

- Frontend: `VITE_API_URL`
- Backend: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `ENVIRONMENT`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- Future: LLM provider API keys only after agent workflow specs require them.

Recommended deployment:

- Frontend: Cloudflare Pages or Cloudflare Workers-compatible deployment.
- Backend: containerized Python service with Postgres, Redis, and background worker support.
- Database: managed Postgres.
- Cache or queue: managed Redis only if realtime or workers are enabled.

## Testing And Observability

Frontend verification:

- `bun run lint`
- `bun run build`
- Future unit tests for pure helpers and permission labels.
- Future component tests for onboarding, discover, intro approval, and agent settings.
- Future browser smoke tests for the golden demo path.

Backend verification:

- Unit tests for community-scoped matching and permission services.
- Route tests for auth, profiles, discovery, intros, and conversations.
- Security tests for cross-user access, membership boundaries, and blocked contact sharing.
- Migration tests or seed tests when schema changes are significant.

Observability target:

- Backend structured logs.
- Request IDs.
- Health endpoint.
- Error capture on frontend and backend.
- Audit events for agent actions and user approvals.

Events worth tracking:

- Onboarding completed.
- Agent activated or paused.
- Discovery query submitted.
- Match opened.
- Agent transcript generated.
- Intro draft created.
- Intro approved, rejected, accepted, or cancelled.
- Permission blocked an action.

## Current Known Gaps

- Frontend still uses localStorage and mock data for key behavior.
- Backend exists but is not fully connected to the frontend.
- Auth flow is prototype-level.
- Discovery is deterministic mock scoring.
- Some UI controls may be presentational only.
- Permission gates need backend enforcement.
- No CI is configured yet.
- No frontend test runner is configured yet.

## Recommended Next Technical Milestone

Connect the frontend to the backend for the current user, profiles, discovery, and intro requests while preserving a seedable demo mode. This gives the app persistence, validates the backend shape, and unlocks production-prototype behavior without overbuilding agent autonomy.
