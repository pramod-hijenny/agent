"""Unit tests for the deterministic scoring + blend (spec §6). Run: pytest backend/tests."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.scoring import blend_score, deterministic_score  # noqa: E402


def test_spec6_formula():
    r = deterministic_score(
        {"interests": ["AI", "B2B"], "goals": ["fundraising"], "city": "SF"},
        {"interests": ["AI", "B2B"], "goals": ["fundraising"], "city": "SF"},
    )
    assert r["score"] == 77  # 40 + 2*8 + 1*6 + 15
    assert r["reasons"]


def test_no_overlap_base_40():
    r = deterministic_score({"interests": ["AI"]}, {"interests": ["cooking"]})
    assert r["score"] == 40
    assert "Open to compatible introductions" in r["reasons"]


def test_caps_at_99():
    many = [f"i{i}" for i in range(20)]
    r = deterministic_score({"interests": many, "city": "x"}, {"interests": many, "city": "x"})
    assert r["score"] == 99


def test_blend_deterministic_only_when_no_similarity():
    assert blend_score(77, None) == 77


def test_blend_with_similarity():
    assert blend_score(80, 0.5) == 68  # 0.6*80 + 0.4*0.5*100


def test_blend_clamps():
    assert blend_score(99, 1.0) == 99  # 0.6*99 + 0.4*100 = 99.4 → 99
    assert blend_score(0, 0.0) == 0
