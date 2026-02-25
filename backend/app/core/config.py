<<<<<<< Updated upstream
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TechzazEDR Dashboard"
    API_V1_STR: str = "/api/v1"

    class Config:
        case_sensitive = True
=======
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Techzaz EDR Dashboard"
    API_V1_STR: str = "/api/v1"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)
>>>>>>> Stashed changes

settings = Settings()
