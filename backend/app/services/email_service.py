# services/email_service.py
"""
services/email_service.py

Small reusable SMTP email sender, used for the approval-change and
new-comment email alerts (see approval_service._notify_safely and
comment_service.create_comment).

Callers never call send_email() directly from a request path — they
schedule it via `queue_email(background_tasks, ...)`, which hands a
plain synchronous function to FastAPI's BackgroundTasks. Starlette
runs sync background callables in a threadpool, so the blocking
smtplib call never holds up the event loop or the response that
triggered it.

Fail-soft throughout: a missing SMTP configuration or a send failure
is logged and swallowed here, never raised — email alerts are a
supplement to the existing in-app notifications, not a dependency of
the workflow that triggered them.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from uuid import UUID

from fastapi import BackgroundTasks

from app.config import settings

logger = logging.getLogger("edrp.email")

_warned_unconfigured = False


def is_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


def send_email(*, to_email: str, subject: str, text_body: str, html_body: str) -> None:
    """
    Synchronous by design — see module docstring. Never raises.
    """

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
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
    except Exception:
        logger.exception(
            "Failed to send email to %s (subject=%r); continuing without it.",
            to_email,
            subject,
        )


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
    decision_id: UUID,
) -> None:
    """
    Builds the email content and schedules it on `background_tasks`.
    No I/O happens here — safe to call from within a request handler
    while the DB session is still open.
    """

    if not to_email:
        return

    decision_url = f"{settings.FRONTEND_BASE_URL}/?decision_id={decision_id}"
    subject = f"[EDRP] {heading}"
    text_body = (
        f"{heading}\n\n"
        f"Decision: {decision_title}\n\n"
        f"{message}\n\n"
        f"View it here: {decision_url}\n"
    )
    html_body = _render_html(
        heading=heading,
        message=message,
        decision_title=decision_title,
        decision_url=decision_url,
    )

    background_tasks.add_task(
        send_email,
        to_email=to_email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )
