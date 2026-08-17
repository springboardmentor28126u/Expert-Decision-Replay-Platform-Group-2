"""CAPTCHA service for generating SVG challenges and verifying responses."""

import base64
import hashlib
import hmac
import random
import time
from typing import Tuple

from app.config import get_settings
from app.exceptions.handlers import BadRequestException

settings = get_settings()


class CaptchaService:
    """Service to generate and verify stateless visual CAPTCHA challenges."""

    CAPTCHA_EXPIRY_SECONDS = 300  # 5 minutes

    @classmethod
    def _generate_signature(cls, answer: str, expires_at: int) -> str:
        """Create a case-sensitive HMAC signature for the CAPTCHA answer and expiration timestamp."""
        message = f"{answer.strip()}:{expires_at}".encode("utf-8")
        secret = settings.jwt_secret_key.encode("utf-8")
        return hmac.new(secret, message, hashlib.sha256).hexdigest()

    CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"  # Mixed-case alphanumeric charset


    @classmethod
    def generate_captcha(cls) -> Tuple[str, str]:
        """Generate a random 5-character alphanumeric CAPTCHA challenge, return (captcha_id, svg_base64_data)."""
        # Pick 5 random unambiguous alphanumeric characters
        code = "".join(random.choices(cls.CHARSET, k=5))
        answer = code

        expires_at = int(time.time()) + cls.CAPTCHA_EXPIRY_SECONDS
        sig = cls._generate_signature(answer, expires_at)
        captcha_id = f"{expires_at}.{sig}"

        # Generate custom SVG image
        svg_content = cls._render_svg(code)
        encoded_svg = base64.b64encode(svg_content.encode("utf-8")).decode("utf-8")
        data_url = f"data:image/svg+xml;base64,{encoded_svg}"

        return captcha_id, data_url


    @classmethod
    def verify_captcha(cls, captcha_id: str, captcha_answer: str) -> bool:
        """Verify the user's submitted CAPTCHA answer against the signed captcha_id."""
        if not captcha_id or not captcha_answer:
            raise BadRequestException("CAPTCHA token and answer are required.")

        parts = captcha_id.split(".", 1)
        if len(parts) != 2:
            raise BadRequestException("Invalid CAPTCHA token format.")

        try:
            expires_at = int(parts[0])
            expected_sig = parts[1]
        except ValueError:
            raise BadRequestException("Invalid CAPTCHA token.")

        if time.time() > expires_at:
            raise BadRequestException("CAPTCHA has expired. Please refresh and try again.")

        actual_sig = cls._generate_signature(captcha_answer.strip(), expires_at)
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise BadRequestException("Incorrect CAPTCHA answer. Please try again.")

        return True

    @classmethod
    def _render_svg(cls, text: str) -> str:
        """Render a colorful SVG image with noise lines and background distortion."""
        width = 170
        height = 50

        # Background grid and noise lines
        lines_svg = ""
        colors = ["#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"]

        for _ in range(5):
            x1 = random.randint(0, width)
            y1 = random.randint(0, height)
            x2 = random.randint(0, width)
            y2 = random.randint(0, height)
            color = random.choice(colors)
            lines_svg += f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-opacity="0.3" stroke-width="1.5" />'

        for _ in range(20):
            cx = random.randint(0, width)
            cy = random.randint(0, height)
            r = random.randint(1, 3)
            color = random.choice(colors)
            lines_svg += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}" fill-opacity="0.25" />'

        # Render characters with slight rotation & offset
        char_svg = ""
        x_offset = 20
        text_colors = ["#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#34d399", "#fbbf24"]
        for char in text:
            rot = random.randint(-18, 18)
            y_offset = 34 + random.randint(-4, 4)
            col = random.choice(text_colors)
            font_size = random.randint(23, 27)
            char_svg += (
                f'<text x="{x_offset}" y="{y_offset}" fill="{col}" font-family="Courier New, monospace, sans-serif" '
                f'font-size="{font_size}" font-weight="900" transform="rotate({rot}, {x_offset}, {y_offset})">{char}</text>'
            )
            x_offset += 28

        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" style="background-color: #0f172a; border-radius: 8px; user-select: none;">
            <rect width="100%" height="100%" fill="#0f172a" rx="8" />
            {lines_svg}
            {char_svg}
        </svg>"""
        return svg

