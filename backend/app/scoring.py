"""Deterministic match scoring (spec §6) + the semantic blend used by Discovery.

Pure functions — unit-tested with pytest (backend/tests), no I/O.
"""


def deterministic_score(me: dict, candidate: dict) -> dict:
    """Spec §6: base 40 + 8/shared interest + 6/shared goal + 15 same city, cap 99."""
    me_interests = {s.lower() for s in (me.get("interests") or [])}
    me_goals = {s.lower() for s in (me.get("goals") or [])}
    shared_interests = [s for s in (candidate.get("interests") or []) if s.lower() in me_interests]
    shared_goals = [s for s in (candidate.get("goals") or []) if s.lower() in me_goals]

    score = 40 + len(shared_interests) * 8 + len(shared_goals) * 6
    reasons: list[str] = []
    if shared_interests:
        reasons.append(f"Shared interests: {', '.join(shared_interests[:3])}")
    if shared_goals:
        reasons.append(f"Shared goals: {', '.join(shared_goals[:3])}")

    me_city = (me.get("city") or "").lower()
    cand_city = (candidate.get("city") or "").lower()
    if me_city and cand_city and me_city == cand_city:
        score += 15
        reasons.append(f"Same city: {candidate.get('city')}")
    if not reasons:
        reasons.append("Open to compatible introductions")

    return {"score": min(score, 99), "reasons": reasons}


BLEND_W_DETERMINISTIC = 0.6
BLEND_W_SEMANTIC = 0.4


def blend_score(deterministic: int, similarity: float | None) -> int:
    """Blend deterministic (0-99) with cosine similarity (0-1). No need → deterministic only."""
    if similarity is None:
        return max(0, min(100, round(deterministic)))
    blended = BLEND_W_DETERMINISTIC * deterministic + BLEND_W_SEMANTIC * similarity * 100
    return max(0, min(100, round(blended)))
