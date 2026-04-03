from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives at the project root, one level above backend/
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else ".env",
        extra="ignore",
        case_sensitive=False,
    )

    jwt_secret: str = "superhero-dev-secret"
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = 60 * 24

    gateway_service_url: str = "http://gateway:8000"
    auth_service_url: str = "http://auth-service:8001"
    ai_service_url: str = "http://ai-service:8002"
    voice_service_url: str = "http://voice-service:8003"
    executor_service_url: str = "http://executor-service:8004"

    nvidia_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("NVIDIA_AI_API_KEY", "NVIDIA_API_KEY"),
    )
    nvidia_model: str = Field(
        default="nvidia/tiiuae/falcon3-7b-instruct",
        validation_alias=AliasChoices("NVIDIA_AI_MODEL", "NVIDIA_MODEL"),
    )
    openrouter_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("OPENROUTER_API_KEY"),
    )
    openrouter_model: str = Field(
        default="qwen/qwen3.6-plus:free",
        validation_alias=AliasChoices("OPENROUTER_MODEL", "OEPNROUTER_MODEL"),
    )
    elevenlabs_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("ELEVENLABS_API_KEY", "ELVEN_LABS_API_KEY"),
    )
    assemblyai_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("ASSEMBLYAI_API_KEY"),
    )

    voice_spiderman_id: str = "ErXwobaYiN019PkySvjV"
    voice_batman_id: str = "VR6AewLTigWG4xSOukaG"
    voice_superman_id: str = "pNInz6obpgDQGcFmaJgB"
    voice_ironman_id: str = "TxGEqnHWrfWFTfGW9XjX"

    enable_docker_sandbox: bool = False
    docker_timeout_seconds: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
