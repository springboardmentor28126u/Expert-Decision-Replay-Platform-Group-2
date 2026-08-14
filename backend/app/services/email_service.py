import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

SMTP_SERVER = settings.SMTP_SERVER
SMTP_PORT = settings.SMTP_PORT or 587
SMTP_EMAIL = settings.SMTP_EMAIL
SMTP_PASSWORD = settings.SMTP_PASSWORD


def send_email(to_email, subject, body):
    try:
        if not SMTP_SERVER or not SMTP_EMAIL or not SMTP_PASSWORD:
            raise ValueError("SMTP configuration is missing. Check backend/.env")

        message = MIMEMultipart()
        message["From"] = SMTP_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        print("SMTP_SERVER =", SMTP_SERVER)
        print("SMTP_PORT =", SMTP_PORT)
        print("SMTP_EMAIL =", SMTP_EMAIL)

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, message.as_string())
        server.quit()
        return True

    except Exception as e:
        print("Email Error:", e)
        return False