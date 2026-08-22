import smtplib
from email.message import EmailMessage

from app.config import (
    EMAIL_ENABLED,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
)


# =====================================================
# SEND EMAIL
# =====================================================

def send_email(
    to_email: str,
    subject: str,
    body: str
) -> bool:

    # -------------------------------------------------
    # Check whether email is enabled
    # -------------------------------------------------

    if not EMAIL_ENABLED:
        print("Email notifications are disabled.")
        return False

    # -------------------------------------------------
    # Check SMTP username
    # -------------------------------------------------

    if not SMTP_USERNAME:
        print("SMTP username is not configured.")
        return False

    # -------------------------------------------------
    # Check SMTP password
    # -------------------------------------------------

    if not SMTP_PASSWORD:
        print("SMTP password is not configured.")
        return False

    # -------------------------------------------------
    # Create email
    # -------------------------------------------------

    message = EmailMessage()

    message["Subject"] = subject

    message["From"] = (
        f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    )

    message["To"] = to_email

    message.set_content(body)

    # -------------------------------------------------
    # Connect to SMTP server
    # -------------------------------------------------

    try:

        with smtplib.SMTP(
            SMTP_HOST,
            SMTP_PORT
        ) as server:

            server.starttls()

            server.login(
                SMTP_USERNAME,
                SMTP_PASSWORD
            )

            server.send_message(message)

        print(
            f"Email sent successfully to {to_email}"
        )

        return True

    except Exception as e:

        print(
            f"Email sending failed: {e}"
        )

        return False