"""Shared test environment for backend imports."""
import os

os.environ.setdefault("NEBIUS_API_KEY", "dummy")
os.environ.setdefault("INSFORGE_API_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")
