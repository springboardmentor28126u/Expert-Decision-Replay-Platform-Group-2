from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str
    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_NAME: str
    DATABASE_USER: str
    DATABASE_PASSWORD: str

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    SMTP_SERVER: str
    SMTP_PORT: int
    SMTP_EMAIL: str
    SMTP_PASSWORD: str

    @property
    def DATABASE_URL(self):
        return (
            f"postgresql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}"
            f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
