from app.services.email_service import send_email

if send_email(
    "paidisphoorthisree@gmail.com",
    "SMTP Test",
    "Congratulations! Email notifications are working."
):
    print("Email Sent")
else:
    print("Email failed to send")