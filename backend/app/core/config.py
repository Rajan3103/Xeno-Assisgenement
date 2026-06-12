from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "XenoPulse CRM Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    GEMINI_API_KEY: str = ""
    CHANNEL_SERVICE_URL: str = "http://localhost:8001/api/v1/send"

    model_config = ConfigDict(case_sensitive=True, env_file=".env")


settings = Settings()
