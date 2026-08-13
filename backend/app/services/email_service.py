import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv
load_dotenv()


SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_email(to_email, subject, body):
    try:
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

        server.sendmail(
            SMTP_EMAIL,
            to_email,
            message.as_string()
        )

        server.quit()

        return True

    except Exception as e:
        print("Email Error:", e)
        return False