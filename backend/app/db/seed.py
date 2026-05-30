import asyncio
from uuid import UUID

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models import AgentMemory, AgentPersona, Community, Membership, Permissions, Profile, User

SEED_USERS = [
    {
        "email": "maya@example.com",
        "full_name": "Maya Chen",
        "city": "San Francisco",
        "profession": "Founder",
        "company": "Lumen AI",
        "role": "Founder",
        "stage": "Pre-seed",
        "bio": "Building AI onboarding tools for B2B SaaS teams.",
        "interests": ["AI", "B2B SaaS", "Product strategy", "Design partners"],
        "skills": ["Product", "Customer discovery", "AI/ML"],
        "goals": ["customers", "feedback", "peer_support"],
        "current_ask": "Find design partners who can give feedback on onboarding analytics.",
        "offering": "Can share early-stage founder lessons and AI product feedback.",
        "availability": "Two 30-minute calls per week",
        "tone": "Warm",
    },
    {
        "email": "jordan@example.com",
        "full_name": "Jordan Lee",
        "city": "San Francisco",
        "profession": "AI Engineer",
        "company": "Stealth",
        "role": "Builder",
        "stage": "Idea validation",
        "bio": "AI infrastructure engineer exploring a developer-tools startup.",
        "interests": ["AI", "Developer tools", "Engineering", "AI agents"],
        "skills": ["Engineering", "AI/ML", "Developer relations"],
        "goals": ["cofounders", "feedback", "peer_support"],
        "current_ask": "Meet product-minded founders who understand developer workflows.",
        "offering": "Can help with AI architecture, evaluation, and technical scoping.",
        "availability": "Evenings and Friday afternoons",
        "tone": "Direct",
    },
    {
        "email": "sofia@example.com",
        "full_name": "Sofia Alvarez",
        "city": "San Francisco",
        "profession": "Product Designer",
        "company": "Figma",
        "role": "Mentor",
        "stage": "Advisor",
        "bio": "Product design mentor helping early teams improve onboarding.",
        "interests": ["Design", "Product strategy", "B2B SaaS", "Mentorship"],
        "skills": ["Design", "Product", "Customer discovery"],
        "goals": ["mentorship", "feedback", "advisors"],
        "current_ask": "Meet founders who need sharp UX feedback and can act on it quickly.",
        "offering": "Can give practical feedback on onboarding flows, design systems, and AI UX.",
        "availability": "One mentor coffee per week",
        "tone": "Warm",
    },
    {
        "email": "nina@example.com",
        "full_name": "Nina Patel",
        "city": "San Francisco",
        "profession": "Seed Investor",
        "company": "Northstar Ventures",
        "role": "Investor",
        "stage": "Seed",
        "bio": "Seed investor focused on B2B AI, workflow automation, and vertical software.",
        "interests": ["Investing", "B2B SaaS", "AI agents", "Go-to-market", "Operations"],
        "skills": ["Fundraising", "Sales", "Finance"],
        "goals": ["fundraising", "advisors", "partnerships"],
        "current_ask": "Meet founders with clear customer pull in B2B AI or vertical software.",
        "offering": "Can give fundraising feedback and make operator/advisor intros when there is fit.",
        "availability": "Selective office hours",
        "tone": "Professional",
    },
    {
        "email": "omar@example.com",
        "full_name": "Omar Williams",
        "city": "Oakland",
        "profession": "Growth Operator",
        "company": "Formerly Ramp",
        "role": "Operator",
        "stage": "Scale-up",
        "bio": "Growth and revenue operator helping technical founders turn early usage into repeatable pipeline.",
        "interests": ["Growth", "Go-to-market", "B2B SaaS", "Operations", "Startups"],
        "skills": ["Sales", "Marketing", "Operations"],
        "goals": ["advisors", "customers", "hiring"],
        "current_ask": "Meet technical founders who need help turning early users into pipeline.",
        "offering": "Can review GTM experiments, landing pages, and outbound motion.",
        "availability": "Office hours every other Thursday",
        "tone": "Direct",
    },
    {
        "email": "elena@example.com",
        "full_name": "Elena Rossi",
        "city": "San Francisco",
        "profession": "Founder",
        "company": "CareLoop",
        "role": "Founder",
        "stage": "Seed",
        "bio": "Healthcare workflow founder looking for operator mentors and design partners in clinics.",
        "interests": ["Healthcare", "Operations", "B2B SaaS", "Design partners", "AI"],
        "skills": ["Product", "Operations", "Customer discovery"],
        "goals": ["customers", "mentorship", "advisors"],
        "current_ask": "Find healthcare operators who can react to a clinic workflow prototype.",
        "offering": "Can share healthcare customer-discovery lessons and workflow research.",
        "availability": "Early mornings or lunchtime",
        "tone": "Professional",
    },
    {
        "email": "priya@example.com",
        "full_name": "Priya Shah",
        "city": "San Francisco",
        "profession": "Founder",
        "company": "LedgerLoop",
        "role": "Founder",
        "stage": "Pre-seed",
        "bio": "Building finance ops automation for seed-stage startups that are outgrowing spreadsheets.",
        "interests": ["Fintech", "Operations", "B2B SaaS", "AI agents", "Fundraising"],
        "skills": ["Finance", "Product", "Operations"],
        "goals": ["customers", "fundraising", "advisors"],
        "current_ask": "Meet finance operators at seed-stage companies who can react to an AI bookkeeping workflow.",
        "offering": "Can help founders think through finance ops, pricing, and early fundraising prep.",
        "availability": "Tuesday and Thursday mornings",
        "tone": "Professional",
    },
    {
        "email": "marcus@example.com",
        "full_name": "Marcus Reed",
        "city": "Berkeley",
        "profession": "Developer Advocate",
        "company": "Formerly Supabase",
        "role": "Advisor",
        "stage": "Advisor",
        "bio": "Developer relations advisor helping devtool startups earn trust with technical communities.",
        "interests": ["Developer tools", "Developer relations", "Community", "Engineering", "Startups"],
        "skills": ["Developer relations", "Community", "Marketing"],
        "goals": ["advisors", "partnerships", "feedback"],
        "current_ask": "Meet technical founders who need honest feedback on developer adoption and docs.",
        "offering": "Can review launch plans, docs, community strategy, and developer onboarding.",
        "availability": "One advisory session every Friday",
        "tone": "Direct",
    },
    {
        "email": "rachel@example.com",
        "full_name": "Rachel Kim",
        "city": "San Mateo",
        "profession": "People Operator",
        "company": "Formerly Notion",
        "role": "Operator",
        "stage": "Scale-up",
        "bio": "Early people and operations leader helping founders make their first ten hires intentionally.",
        "interests": ["Operations", "Hiring", "Community", "Startups", "Product strategy"],
        "skills": ["Operations", "Customer discovery", "Marketing"],
        "goals": ["hiring", "mentorship", "advisors"],
        "current_ask": "Meet founders preparing for their first operator or founding team hires.",
        "offering": "Can help with role design, interview loops, onboarding, and early operating rhythms.",
        "availability": "Two founder office-hour slots per month",
        "tone": "Warm",
    },
    {
        "email": "kenji@example.com",
        "full_name": "Kenji Tanaka",
        "city": "San Francisco",
        "profession": "Climate Founder",
        "company": "GridPilot",
        "role": "Founder",
        "stage": "Seed",
        "bio": "Climate software founder building tools for distributed energy project operations.",
        "interests": ["Climate", "Operations", "B2B SaaS", "Partnerships", "AI"],
        "skills": ["Product", "Sales", "Operations"],
        "goals": ["partnerships", "customers", "peer_support"],
        "current_ask": "Meet energy project operators and B2B founders selling into operational teams.",
        "offering": "Can share climate customer discovery lessons and enterprise pilot structure.",
        "availability": "Wednesday afternoons",
        "tone": "Curious",
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        community_id = UUID("00000000-0000-4000-8000-000000000001")
        community = await session.get(Community, community_id)
        if community is None:
            community = Community(
                id=community_id,
                name="SF Builders Circle",
                type="founder_community",
                city="San Francisco",
                description="A trusted demo network of founders, builders, mentors, investors, and operators.",
            )
            session.add(community)
            await session.flush()

        for item in SEED_USERS:
            user = await session.scalar(select(User).where(User.email == item["email"]))
            if user is None:
                user = User(email=item["email"])
                session.add(user)
                await session.flush()

            membership = await session.scalar(
                select(Membership).where(
                    Membership.user_id == user.id,
                    Membership.community_id == community.id,
                )
            )
            if membership is None:
                session.add(Membership(user_id=user.id, community_id=community.id, role="member"))

            profile = await session.scalar(select(Profile).where(Profile.user_id == user.id))
            profile_data = {
                "community_id": community.id,
                "full_name": item["full_name"],
                "city": item["city"],
                "profession": item["profession"],
                "company": item["company"],
                "role": item["role"],
                "stage": item["stage"],
                "bio": item["bio"],
                "interests": item["interests"],
                "skills": item["skills"],
                "goals": item["goals"],
                "current_ask": item["current_ask"],
                "offering": item["offering"],
                "availability": item["availability"],
                "likes": "Clear asks and thoughtful product feedback",
                "dislikes": "Cold pitches",
                "topics_enjoy": ", ".join(item["interests"][:3]),
                "avatar_color": "from-primary to-agent",
            }
            if profile is None:
                session.add(Profile(user_id=user.id, **profile_data))
            else:
                for key, value in profile_data.items():
                    setattr(profile, key, value)

            agent = await session.scalar(select(AgentPersona).where(AgentPersona.user_id == user.id))
            agent_data = {
                "agent_name": f"{item['full_name'].split()[0]} Agent",
                "tone": item["tone"],
                "agent_intro": (
                    f"I represent {item['full_name']} for useful startup-community introductions."
                ),
                "current_mission": "Find three useful people inside SF Builders Circle",
            }
            if agent is None:
                agent = AgentPersona(user_id=user.id, **agent_data)
                agent.memories.append(AgentMemory(text="Prefers approval before any intro is sent"))
                session.add(agent)
            else:
                for key, value in agent_data.items():
                    setattr(agent, key, value)

            permissions = await session.scalar(select(Permissions).where(Permissions.user_id == user.id))
            if permissions is None:
                session.add(Permissions(user_id=user.id))
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
