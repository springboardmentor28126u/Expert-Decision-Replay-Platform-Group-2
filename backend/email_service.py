import logging
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from fastapi import BackgroundTasks

load_dotenv()

logger = logging.getLogger("edrp.email")

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

_warned_unconfigured = False


def is_configured() -> bool:
    return bool(SMTP_HOST and SMTP_FROM_EMAIL)


def send_email(*, to_email: str, subject: str, text_body: str, html_body: str) -> None:
    print("EMAIL SEND START")
    print("EMAIL TO:", to_email)
    print("SMTP HOST:", SMTP_HOST)
    print("SMTP FROM:", SMTP_FROM_EMAIL)
    
    global _warned_unconfigured

    if not is_configured():
        if not _warned_unconfigured:
            logger.warning(
                "SMTP is not configured (SMTP_HOST/SMTP_FROM_EMAIL unset); "
                "email alerts are disabled. Set SMTP_* variables in .env to enable them."
            )
            _warned_unconfigured = True
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            if SMTP_USE_TLS:
                server.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)
    except Exception:
        logger.exception("Failed to send email to %s (subject=%r); continuing without it.", to_email, subject)


def _render_html(*, heading: str, message: str, decision_title: str, decision_url: str) -> str:
    return (
        "<!doctype html><html><body style=\"font-family:-apple-system,Segoe UI,Arial,"
        "sans-serif;color:#1a1a1a;line-height:1.5;\">"
        "<div style=\"max-width:480px;margin:0 auto;padding:24px;\">"
        f"<h2 style=\"margin:0 0 12px;\">{heading}</h2>"
        f"<p style=\"margin:0 0 8px;color:#555;\">Decision: <strong>{decision_title}</strong></p>"
        f"<p style=\"margin:0 0 20px;\">{message}</p>"
        f"<a href=\"{decision_url}\" style=\"display:inline-block;padding:10px 18px;"
        "background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;\">"
        "View decision</a>"
        "<p style=\"margin-top:24px;font-size:12px;color:#999;\">"
        "This is an automated notification from the Expert Decision Replay Platform."
        "</p></div></body></html>"
    )


def queue_email(
    background_tasks: BackgroundTasks,
    *,
    to_email: str,
    heading: str,
    message: str,
    decision_title: str,
    decision_id,
) -> None:
    if not to_email:
        return

    decision_url = f"{FRONTEND_BASE_URL}/?decision_id={decision_id}"
    subject = f"[EDRP] {heading}"
    text_body = f"{heading}\n\nDecision: {decision_title}\n\n{message}\n\nView it here: {decision_url}\n"
    html_body = _render_html(heading=heading, message=message, decision_title=decision_title, decision_url=decision_url)

    background_tasks.add_task(send_email, to_email=to_email, subject=subject, text_body=text_body, html_body=html_body)