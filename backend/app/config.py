from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DB_HOST: str = "localhost"
    DB_PORT: int = 5433
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_NAME: str = "family_tasks"

    # For Alembic (sync connection string)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5433/family_tasks"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
