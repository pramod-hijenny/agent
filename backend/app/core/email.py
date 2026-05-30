import smtplib
from email.message import EmailMessage

from app.core.config import get_settings


def send_magic_link(email: str, token: str) -> None:
    settings = get_settings()
    link = f"{settings.frontend_origin}/auth?token={token}"
    message = EmailMessage()
    message["Subject"] = "Your AgentCircle sign-in link"
    message["From"] = settings.mail_from
    message["To"] = email
    message.set_content(
        "Use this link to sign in to AgentCircle:\n\n"
        f"{link}\n\n"
        "This link expires soon. If you did not request it, ignore this email."
    )
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        smtp.send_message(message)
