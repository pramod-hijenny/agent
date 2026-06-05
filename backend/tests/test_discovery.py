"""Unit tests for the pure Discovery ranking (deterministic §6 + semantic blend)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.routers.discovery import _flatten, rank  # noqa: E402


def _agent(id_, interests=None, goals=None, city=None):
    return {"id": id_, "interests": interests or [], "goals": goals or [], "city": city}


def test_flatten_lifts_profile_fields():
    row = {"id": "a1", "interests": ["AI"], "profiles": {"city": "SF", "full_name": "Ada"}}
    f = _flatten(row)
    assert f["city"] == "SF" and f["full_name"] == "Ada" and "profiles" not in f


def test_flatten_handles_embedded_list_and_null():
    assert _flatten({"id": "a", "profiles": [{"city": "NYC"}]})["city"] == "NYC"
    assert _flatten({"id": "a", "profiles": None})["city"] is None


def test_rank_deterministic_only_sorts_desc():
    me = _agent("me", interests=["AI", "B2B"], goals=["fundraising"], city="SF")
    cands = [
        _agent("low", interests=["cooking"]),
        _agent("high", interests=["AI", "B2B"], goals=["fundraising"], city="SF"),
    ]
    out = rank(me, cands, None, 10)
    assert out[0]["agent"]["id"] == "high"
    assert out[0]["score"] == 77  # 40 + 16 + 6 + 15
    assert out[0]["similarity"] is None


def test_rank_blends_similarity_and_respects_limit():
    me = _agent("me", interests=["AI"])
    cands = [_agent("x", interests=["AI"]), _agent("y")]  # det 48 and 40
    sims = {"x": 0.2, "y": 0.95}  # y gets a big semantic boost
    out = rank(me, cands, sims, 1)
    assert len(out) == 1
    # y: 0.6*40 + 0.4*95 = 62 ; x: 0.6*48 + 0.4*20 = 36.8→37 → y ranks first
    assert out[0]["agent"]["id"] == "y" and out[0]["score"] == 62
