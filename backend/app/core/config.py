from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Techzaz EDR Dashboard"
    API_V1_STR: str = "/api/v1"

    # Firebase Service Account Fields
    FIREBASE_TYPE: str = "service_account"
    FIREBASE_PROJECT_ID: str = "techzazedr"
    FIREBASE_PRIVATE_KEY_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_CLIENT_ID: str = ""
    FIREBASE_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    FIREBASE_AUTH_PROVIDER_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    FIREBASE_CLIENT_CERT_URL: str = ""
    FIREBASE_UNIVERSE_DOMAIN: str = "googleapis.com"

    # Auth Settings
    ALGORITHM: str = "RS256"
<<<<<<< Updated upstream
    
=======
    ALERTS_API_KEY: str = "tz_demo_d3m00rgk3y"

>>>>>>> Stashed changes
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
