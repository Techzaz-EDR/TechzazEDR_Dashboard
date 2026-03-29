from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Techzaz EDR Dashboard"
    API_V1_STR: str = "/api/v1"
    
    # Firebase Settings
    FIREBASE_TYPE: str = Field(default="service_account")
    FIREBASE_PROJECT_ID: str = Field(default="techzazedr")
    FIREBASE_PRIVATE_KEY_ID: str = Field(default="")
    FIREBASE_PRIVATE_KEY: str = Field(default="")
    FIREBASE_CLIENT_EMAIL: str = Field(default="")
    FIREBASE_CLIENT_ID: str = Field(default="")
    FIREBASE_AUTH_URI: str = Field(default="https://accounts.google.com/o/oauth2/auth")
    FIREBASE_TOKEN_URI: str = Field(default="https://oauth2.googleapis.com/token")
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: str = Field(default="https://www.googleapis.com/oauth2/v1/certs")
    FIREBASE_CLIENT_X509_CERT_URL: str = Field(default="")
    FIREBASE_UNIVERSE_DOMAIN: str = Field(default="googleapis.com")
    
    # Auth Settings
    ALGORITHM: str = "RS256"
    ALERTS_API_KEY: str = "tz_demo_d3m00rgk3y"
    
    # CORS Settings
    ALLOWED_ORIGINS: list[str] = ["*"]
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
