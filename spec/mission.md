# Mission

## Product

AgentCircle is an AI-mediated networking app for high-intent startup and builder communities.

Each member creates a human profile and an AI networking representative. The representative helps the member discover relevant people inside a trusted network, compare goals and context, draft warm introductions, and ask for explicit approval before any real-world connection is made.

The first product should not try to be a general social media app, a dating app, or an event ticketing platform. It should be a focused networking layer for communities where people already have a reason to meet: founders, builders, operators, investors, mentors, advisors, customers, and startup peers.

## Mission Statement

Help startup people meet the right people faster through trusted, explainable, consent-first introductions.

AgentCircle should reduce the work of finding useful people while keeping humans in control of every introduction, message, and contact-sharing decision.

## First MVP Promise

The first MVP promise is:

> Tell your AI who you need to meet. AgentCircle finds three useful people in your trusted startup community, explains why each match matters, and drafts an introduction that both sides can approve.

This promise is intentionally narrow. The product should be judged by whether it can reliably answer:

- Who should I meet this week?
- Why is this person relevant to my goal?
- What should we talk about?
- Is the introduction safe, useful, and approved by both sides?

## Target Market

AgentCircle should start with startup and builder networks where the value of one good introduction is high.

Primary customer segments:

- Startup accelerators that want better founder, mentor, investor, and alumni matching.
- Founder communities that want members to find collaborators, customers, advisors, and peers.
- Coworking spaces and innovation hubs that want members to meet relevant people nearby.
- VC portfolio networks that want to connect founders with operators, advisors, and other founders.
- Hackathons, demo days, and startup events that want attendee matching before and during the event.
- Professional communities for AI builders, indie hackers, product leaders, engineers, designers, and operators.

Primary users:

- Founders looking for cofounders, early customers, investors, mentors, advisors, or peer support.
- Builders looking for collaborators, technical partners, design partners, or launch feedback.
- Operators looking for startup roles, advisory opportunities, or peer conversations.
- Investors and mentors looking for relevant founders without noisy cold outreach.
- Community managers who want member-to-member connections to happen more intentionally.

Secondary users, later:

- Conference attendees looking for useful people to meet at an event.
- Professionals looking for peer networking outside startup communities.
- Travelers or newcomers looking for local professional introductions.

Dating, general friendship, and broad consumer social discovery are not part of the first focused MVP.

## Problem

Startup networking is valuable but inefficient.

People often know they need to meet someone, but they do not know who is relevant, who is available, what context matters, or how to start a high-quality conversation. Communities, accelerators, and events may have many valuable members, but their directories, Slack channels, attendee lists, and manual intros do not reliably surface the right connection at the right time.

Common pain points:

- Founders waste time searching member directories, LinkedIn, Slack, Discord, and event lists.
- Cold outreach is low context and easy to ignore.
- Community managers become manual intro brokers and cannot scale thoughtful matching.
- Members miss useful connections because they do not know who else is in the network.
- People hesitate to ask for intros because they do not want to seem transactional or spammy.
- Existing tools show profiles but do not explain fit, timing, mutual value, or next steps.
- AI tools can feel unsafe if they impersonate users, over-share private information, or send messages without permission.

AgentCircle should solve the "who should I meet, why, and how should we start?" problem.

## Positioning

AgentCircle is not a feed-first social network.

It should not compete with Facebook, LinkedIn, X, Instagram, or TikTok on content feeds, posting, virality, or follower graphs.

AgentCircle is not a swipe-first dating app.

It may use match cards, but the goal is not casual browsing or attraction-based matching. The goal is useful, high-context professional introductions.

AgentCircle is not an event management platform.

It should not replace Luma, Eventbrite, or Meetup for ticketing, event pages, attendance, payments, or event logistics. It can become the networking layer for communities and events that already exist.

Best positioning:

> AgentCircle is an AI networking agent for startup communities. It helps members discover relevant people, understand the fit, and approve warm introductions.

## Product Principles

1. Focus beats breadth.
   The first product must serve startup and builder networking before expanding into friendship, dating, travel, or general social discovery.

2. Human approval by default.
   Agents may recommend, compare, summarize, and draft. They must not send messages, share contact details, schedule meetings, or speak as the user unless the user explicitly approves the action.

3. Consent-first introductions.
   Both sides should understand why an intro is being proposed before contact information or scheduling details are exchanged.

4. Explain the match.
   Every recommendation should answer why this person is relevant, what goals or context overlap, what the likely mutual value is, and what the first conversation could cover.

5. AI transparency.
   Agent-authored content, agent-to-agent compatibility checks, AI-generated summaries, and AI-generated intro drafts must be clearly labeled.

6. Useful before magical.
   The app should prioritize practical workflows: onboarding, profile quality, discovery, match explanations, intro drafting, approvals, inbox, and permissions. Advanced autonomy comes later.

7. Deterministic product behavior.
   Core flows should be driven by specs, explicit permissions, typed contracts, seeded fixtures, and testable matching rules rather than scattered UI assumptions.

8. Safety over growth.
   Contact sharing, autonomous sending, investor/fundraising claims, recruiting claims, and sensitive personal data need strict defaults, auditability, and user controls.

## MVP Scope

In the production-ready prototype, a user can:

- Create or sign into an account.
- Join or select a demo startup community.
- Complete onboarding for their profile, current goals, interests, skills, location, availability, and networking intent.
- Configure an AI representative with a name, tone, mission, memory, and permission boundaries.
- Ask for useful people to meet using structured filters or natural language intent.
- Receive a small ranked set of recommendations, starting with three useful people.
- See a clear explanation for each match.
- Preview what the agents compared before an introduction is proposed.
- Review a drafted intro message.
- Edit, approve, cancel, accept, or reject an intro request.
- See an inbox of pending, accepted, rejected, and completed introductions.
- View and update their profile, agent memory, mission, and permissions.
- Pause their agent.
- Trust that sensitive actions require explicit approval.

## Canonical First Workflow

The first repeatable workflow should be:

1. The user states an intent.
   Example: "Find me three AI founders in San Francisco who are building B2B tools and could give feedback on my onboarding flow."

2. The system returns three ranked matches.
   Each match includes fit score, shared context, goal alignment, location relevance, availability, and a plain-language reason.

3. The user opens a match.
   The app shows why the match matters, what each person wants, possible conversation topics, and any permission-sensitive limits.

4. The app drafts an intro.
   The draft explains mutual value without pretending to be the user.

5. The user approves, edits, or cancels.
   No message is sent and no contact details are shared until approval.

6. The recipient accepts or rejects.
   The connection becomes active only after recipient consent.

7. The intro is auditable.
   The system stores what was recommended, what the agent generated, what the user approved, and what was sent.

## Non-Goals For The First MVP

- General-purpose social media feeds.
- Public posting, comments, likes, shares, or follower counts as a primary mechanic.
- Dating, romance, or attraction-based matching.
- Event ticketing, event registration, payment collection, or venue operations.
- Fully autonomous social networking.
- Unbounded agent-to-agent messaging.
- AI agents impersonating users.
- Complex recommendation ML infrastructure.
- Native mobile apps.
- Payment flows.
- Large-scale production operations.
- Importing contacts from email, phone, or social networks.
- Selling access to private contact details.

## Safety Requirements

- Default permissions must prevent autonomous sending and contact sharing.
- Contact fields must never appear in match results by default.
- Agents must not claim to be the human user.
- Agent-generated content must include AI labeling in the UI and stored metadata in the backend.
- Intro drafts must be reviewed by the sender before sending.
- Intro requests must be accepted by the recipient before a connection is treated as active.
- Users must be able to pause their agent.
- Users must be able to delete or edit agent memory.
- Users must be able to block or report another user in later safety phases.
- Every introduction should preserve an auditable transcript or summary.
- Fundraising, hiring, investment, medical, legal, and financial claims must be handled conservatively and should not be generated as factual endorsements.
- The system should explain recommendation logic without exposing private notes, private memory, or hidden profile fields.

## Business Model Hypothesis

The strongest early business model is B2B or community SaaS, not broad consumer social.

Potential buyers:

- Accelerators.
- Founder communities.
- Coworking spaces.
- Startup conferences.
- VC portfolio teams.
- Professional networks.

Potential pricing paths:

- Community subscription based on number of active members.
- Event networking package for conferences, demo days, and hackathons.
- Premium community tier with better matching, analytics, and admin controls.
- Individual pro plan for power networkers after community usage proves retention.
- Concierge intro tier for high-value networks, with careful consent and quality controls.

AgentCircle can make money if it creates measurable networking value:

- More relevant member-to-member introductions.
- Higher event networking satisfaction.
- More mentor, investor, customer, and collaborator connections.
- Less manual work for community managers.
- Better retention for paid communities because members get practical value.

AgentCircle should not rely on ads or viral consumer growth for the first business model.

## Success Metrics

Product activation:

- Percentage of new users who complete onboarding.
- Percentage of users who activate their agent.
- Percentage of users who submit a first discovery intent.

Discovery quality:

- Percentage of recommended matches that users open.
- Percentage of recommendations saved, dismissed, or acted on.
- Percentage of users who understand why a match was recommended.

Intro quality:

- Percentage of drafted intros approved by senders.
- Percentage of approved intros accepted by recipients.
- Percentage of accepted intros that lead to a completed conversation or meeting.

Community value:

- Number of useful intros per active community member per month.
- Community manager time saved on manual intros.
- Retention of communities using AgentCircle.

Safety and trust:

- Zero unapproved contact-sharing events.
- Zero autonomous sends when approval is required.
- Percentage of intro actions with complete audit records.
- Number of blocks, reports, or permission violations.

## Core Entities

- User: authentication identity and account owner.
- Community: a trusted network, accelerator, event, coworking space, portfolio, or professional group.
- Membership: the user's relationship to a community, including role and access level.
- Profile: public-facing human information such as name, city, profession, company, role, skills, interests, goals, bio, availability, and current networking intent.
- Agent persona: AI-facing preferences such as agent name, tone, mission, intro style, memory, and status.
- Agent memory: user-controlled facts, preferences, constraints, and prior interaction context that can influence future recommendations.
- Permissions: allowed, blocked, and approval-required agent capabilities.
- Discovery query: structured or natural-language request describing who the user wants to meet and why.
- Match: a scored recommendation between two profiles with reasons, shared traits, goal alignment, and next actions.
- Match explanation: structured reasoning for the recommendation, including what matched, what is uncertain, and why the connection could be useful.
- Agent transcript: an agent-to-agent compatibility conversation, deterministic simulation, or generated summary.
- Intro draft: AI-generated suggested message that the sender can edit before approval.
- Intro request: a proposed introduction with sender, receiver, message, status, timestamps, and optional summary.
- Conversation: post-introduction message thread or agent discussion record.
- Audit event: durable record of recommendations, drafts, approvals, rejections, permission checks, and contact-sharing decisions.

## Core Journeys

### Journey 1: Join A Community

The user creates or signs into an account, joins a startup community or demo network, enters profile details, selects current goals, identifies skills and interests, configures their agent, reviews permissions, and reaches the home screen with the agent ready.

### Journey 2: Ask Who To Meet

The user describes who they want to meet. The app returns a small ranked set of relevant people with visible match explanations, shared context, and available next actions.

### Journey 3: Review A Match

The user opens a match, sees why the person is relevant, reviews agent-generated compatibility context, checks permission-sensitive details, and decides whether to request an introduction.

### Journey 4: Approve An Intro

The app drafts a warm intro message. The user can edit, approve, or cancel. The recipient can accept or reject. Contact details remain private unless explicitly shared according to policy and permission.

### Journey 5: Manage Inbox And Connections

The user sees pending intro requests, accepted introductions, rejected requests, and completed connections. Each state should make the next action clear.

### Journey 6: Tune Agent

The user updates agent memory, mission, tone, networking goals, availability, and permissions. Changes affect future recommendations and drafts.

### Journey 7: Community Admin Review

Later, a community manager can review aggregate networking health, member activation, intro volume, and safety signals without reading private messages or exposing sensitive user data.

## Quality Bar

The prototype should feel production-ready even before it has production scale. That means:

- The first workflow is understandable without explanation from the builder.
- The app clearly communicates that it is for startup and builder introductions.
- Empty, loading, error, success, disabled, and permission-blocked states are present for important flows.
- No important flow depends only on localStorage.
- Typed API contracts exist between frontend and backend.
- Seeded demo data supports repeatable demos for founder, mentor, investor, operator, and community-manager scenarios.
- Matching behavior is deterministic enough to test.
- Match explanations are structured, not just decorative copy.
- Agent-generated content is labeled.
- Permission-sensitive actions are backend-enforced.
- Intro approval logic is tested.
- The app has a credible path to deployment for frontend and backend.

## Spec-Driven Vibe Coding Rules

This file is the product source of truth. When building with an AI coding agent or human contributor:

- Start from the first MVP promise before adding features.
- Prefer one complete founder-networking workflow over many shallow social features.
- Treat "find me three useful people" as the north-star demo.
- If a feature does not improve discovery quality, intro quality, trust, or community value, it is probably out of scope.
- Do not add dating, friendship, public feeds, event ticketing, or payments unless this mission is intentionally updated.
- Keep UI language concrete: goals, skills, communities, matches, intros, approvals, permissions, and connections.
- Keep sensitive behavior explicit: what the agent can see, what it can say, what it can send, and what requires approval.
- Add or update typed entities before wiring new UI behavior.
- Add deterministic fixtures for every demo flow.
- Add acceptance criteria before implementing major workflow changes.
