from app.services.email_service import send_email

send_email(
    "ishrathshaik9966@gmail.com",
    "SMTP Test",
    "Congratulations! Email notifications are working."
)

print("Email Sent")