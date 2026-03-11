from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Techzaz EDR Dashboard"
    API_V1_STR: str = "/api/v1"
    
    # Firebase Settings
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"
    FIREBASE_PROJECT_ID: str = "techzazedr"
    
    # Auth Settings
    ALGORITHM: str = "RS256"
    ALERTS_API_KEY: str = "tz_demo_d3m00rgk3y"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
