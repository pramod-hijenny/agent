from dataclasses import dataclass

from app.models import Profile


@dataclass
class ScoredProfile:
    profile: Profile
    score: int
    reasons: list[str]
    suggested_activity: str


def score_profile(me: Profile, candidate: Profile, query: str, city: str, goal: str) -> ScoredProfile:
    score = 25
    reasons: list[str] = []

    if me.community_id and candidate.community_id == me.community_id:
        score += 15
        reasons.append("Same trusted community")

    me_interests = me.interests or []
    candidate_interests = candidate.interests or []
    candidate_skills = candidate.skills or []
    candidate_goals = candidate.goals or []

    shared = sorted(set(me_interests).intersection(candidate_interests))
    if shared:
        score += min(24, len(shared) * 6)
        reasons.append(f"Shared context: {', '.join(shared[:3])}")

    complementary_skills = sorted(
        {
            skill
            for skill in candidate_skills
            if skill.lower() in f"{me.current_ask} {query}".lower()
        }
    )
    if complementary_skills:
        score += min(24, len(complementary_skills) * 8)
        reasons.append(f"Can help with: {', '.join(complementary_skills[:3])}")

    if city and candidate.city.lower() == city.lower():
        score += 10
        reasons.append(f"Also in {candidate.city}")

    if goal != "any" and goal in candidate_goals:
        score += 18
        reasons.append(f"Aligned goal: {goal}")

    q = query.lower()
    haystack = " ".join(
        [
            candidate.bio or "",
            candidate.role or "",
            candidate.stage or "",
            candidate.current_ask or "",
            candidate.offering or "",
            " ".join(candidate_interests),
            " ".join(candidate_skills),
        ]
    ).lower()
    matching_words = [word for word in q.split() if len(word) > 3 and word in haystack]
    if matching_words:
        score += min(15, len(matching_words) * 3)
        reasons.append("Bio matches your request")

    if not reasons:
        reasons.append("Clear startup networking ask")

    activity = candidate.availability or "Start with a short intro chat"

    return ScoredProfile(profile=candidate, score=min(score, 100), reasons=reasons, suggested_activity=activity)
