from app.db.seed import SEED_USERS


def test_seed_profiles_cover_demo_personas() -> None:
    assert len(SEED_USERS) >= 10
    roles = {user["role"] for user in SEED_USERS}
    assert {"Founder", "Builder", "Mentor", "Investor", "Operator", "Advisor"}.issubset(roles)
    assert all(user["current_ask"] for user in SEED_USERS)
    assert all(user["offering"] for user in SEED_USERS)
    assert all(user["skills"] for user in SEED_USERS)
