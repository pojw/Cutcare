import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """
    Central application settings loaded from environment variables.

    AUTH_MODE options:
    - "mock": local development without Firebase token verification
    - "firebase": verify Firebase ID tokens with Firebase Admin
    """

    APP_NAME: str = os.getenv("PROJECT_NAME", "notloadingENV")
    APP_VERSION: str = "0.2.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    AUTH_MODE: str = os.getenv("AUTH_MODE", "mock").lower()
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    AI_PROFILE_STORAGE_ENABLED: bool = (
        os.getenv("AI_PROFILE_STORAGE_ENABLED", "false").lower()
        == "true"
    )

    FIREBASE_PROJECT_ID: str | None = os.getenv(
        "FIREBASE_PROJECT_ID"
    )
    FIREBASE_CLIENT_EMAIL: str | None = os.getenv(
        "FIREBASE_CLIENT_EMAIL"
    )
    FIREBASE_PRIVATE_KEY: str | None = os.getenv(
        "FIREBASE_PRIVATE_KEY"
    )
    FIREBASE_STORAGE_BUCKET: str | None = os.getenv(
        "FIREBASE_STORAGE_BUCKET"
    )

    HF_TOKEN: str | None = os.getenv("HF_TOKEN")
    HF_MODEL: str = os.getenv(
        "HF_MODEL",
        "Qwen/Qwen3.5-4B:featherless-ai",
    )
    HF_BASE_URL: str = os.getenv(
        "HF_BASE_URL",
        "https://router.huggingface.co/v1",
    )

    OPENAI_MODEL: str = os.getenv(
        "OPENAI_MODEL","gpt-5.6-luna"
    )
    OPENAI_BASE_URL: str = os.getenv(
        "OPENAI_BASE_URL",
        "https://api.openai.com/v1",
    )
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")

    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]

    @property
    def firebase_configured(self) -> bool:
        """
        Returns True when all Firebase Admin environment variables exist.
        """

        return all(
            [
                self.FIREBASE_PROJECT_ID,
                self.FIREBASE_CLIENT_EMAIL,
                self.FIREBASE_PRIVATE_KEY,
                self.FIREBASE_STORAGE_BUCKET,
            ]
        )

    @property
    def use_firebase_auth(self) -> bool:
        return self.AUTH_MODE == "firebase"

    @property
    def use_mock_auth(self) -> bool:
        return self.AUTH_MODE == "mock"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()