from pathlib import Path

from app.core.config import BACKEND_ROOT
from app.services.email_service import get_email_settings


def test_backend_root_points_to_backend_directory():
    assert BACKEND_ROOT == Path(__file__).resolve().parents[1]
    assert (BACKEND_ROOT / ".env").exists()


def test_email_settings_load_from_backend_env_file():
    settings = get_email_settings()
    assert settings["SMTP_SERVER"] == "smtp.gmail.com"
    assert settings["SMTP_EMAIL"] == "edrpgroup3@gmail.com"
    assert settings["SMTP_PASSWORD"]
