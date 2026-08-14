from pathlib import Path

from app.core.config import BACKEND_ROOT


def test_backend_root_points_to_backend_directory():
    assert BACKEND_ROOT == Path(__file__).resolve().parents[1]
    assert (BACKEND_ROOT / ".env").exists()
