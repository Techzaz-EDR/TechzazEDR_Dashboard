from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Techzaz EDR Dashboard"
    API_V1_STR: str = "/api/v1"
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
