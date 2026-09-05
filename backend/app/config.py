from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    HUNAR_API_KEY: str
    PUBLIC_BACKEND_URL: str = ""
    DATABASE_URL: str = "sqlite:///./test.db"
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
