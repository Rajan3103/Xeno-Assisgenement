from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "XenoPulse Channel Service"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8001

    # Email config
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "user@example.com"
    SMTP_PASSWORD: str = "password"
    SMTP_FROM_EMAIL: str = "noreply@xenopulse.ai"

    # Twilio config
    TWILIO_ACCOUNT_SID: str = "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    TWILIO_AUTH_TOKEN: str = "your_auth_token"
    TWILIO_PHONE_NUMBER: str = "+1234567890"
    TWILIO_WHATSAPP_NUMBER: str = "+14155238886"

    # CRM Callback URL
    CRM_CALLBACK_URL: str = "http://localhost:8000/api/v1/communications/callback"

    model_config = ConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
