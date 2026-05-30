from app.models import Profile
from app.services.matching import score_profile


def test_score_profile_rewards_shared_interests_and_city() -> None:
    me = Profile(
        full_name="Alex",
        city="San Francisco",
        interests=["AI", "Coffee"],
        goals=["feedback"],
        skills=["Product"],
        current_ask="Find AI founders who can give feedback on onboarding.",
    )
    candidate = Profile(
        full_name="Maya",
        city="San Francisco",
        interests=["AI", "Food"],
        skills=["Product"],
        goals=["feedback"],
        current_ask="Find design partners.",
        offering="Can give product feedback.",
        availability="Two short calls per week",
    )

    result = score_profile(me, candidate, "meet AI founders in San Francisco", "San Francisco", "feedback")

    assert result.score >= 50
    assert result.reasons


def test_score_profile_rewards_startup_skill_complement() -> None:
    me = Profile(
        full_name="Alex",
        city="San Francisco",
        interests=["AI"],
        goals=["customers"],
        current_ask="Need sales help for a B2B AI onboarding product.",
    )
    candidate = Profile(
        full_name="Omar",
        city="Oakland",
        interests=["Go-to-market"],
        skills=["Sales", "Operations"],
        goals=["customers"],
        current_ask="Meet technical founders who need GTM help.",
        offering="Can review sales motion and pipeline experiments.",
    )

    result = score_profile(me, candidate, "sales help for B2B AI", "", "customers")

    assert result.score >= 50
    assert any("Can help with: Sales" in reason for reason in result.reasons)
