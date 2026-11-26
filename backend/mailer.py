"""Email bhejne ka simple helper (password reset code ke liye)."""

import smtplib
from email.message import EmailMessage

from flask import current_app


def send_email(to, subject, body):
    cfg = current_app.config

    if not cfg.get("SMTP_HOST"):
        # SMTP set nahi hai: development mein code log mein dikha do
        current_app.logger.warning(
            "SMTP not configured. Email to %s | %s\n%s", to, subject, body
        )
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = cfg.get("MAIL_FROM") or cfg.get("SMTP_USER")
    msg["To"] = to
    msg.set_content(body)

    try:
        with smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=10) as smtp:
            smtp.starttls()
            if cfg.get("SMTP_USER"):
                smtp.login(cfg["SMTP_USER"], cfg["SMTP_PASSWORD"])
            smtp.send_message(msg)
        return True
    except (smtplib.SMTPException, OSError) as error:
        current_app.logger.error("Email sending failed: %s", error)
        return False
