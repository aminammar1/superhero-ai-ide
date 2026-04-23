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

    # ── AgentRouter (primary AI provider) ──
    agent_router_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("AGENT_ROUTER_API_KEY"),
    )
    agent_router_base_url: str = "https://agentrouter.org/v1"
    agent_router_chat_models: str = Field(
        default="gpt-5,claude-sonnet-4-20250514",
        validation_alias=AliasChoices("AGENT_ROUTER_CHAT_MODELS"),
    )
    agent_router_code_models: str = Field(
        default="gpt-5,claude-sonnet-4-20250514",
        validation_alias=AliasChoices("AGENT_ROUTER_CODE_MODELS"),
    )

    # ── NVIDIA NIM ──
    nvidia_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("NVIDIA_AI_API_KEY", "NVIDIA_API_KEY"),
    )
    nvidia_model: str = Field(
        default="meta/llama-3.3-70b-instruct",
        validation_alias=AliasChoices("NVIDIA_AI_MODEL", "NVIDIA_MODEL"),
    )
    nvidia_chat_models: str = Field(
        default="meta/llama-3.3-70b-instruct,meta/llama-3.1-8b-instruct,nvidia/llama-3.1-nemotron-nano-8b-v1,nvidia/nemotron-mini-4b-instruct",
        validation_alias=AliasChoices("NVIDIA_CHAT_MODELS"),
    )
    nvidia_code_models: str = Field(
        default="meta/llama-3.3-70b-instruct,meta/llama-3.1-8b-instruct,nvidia/llama-3.1-nemotron-nano-8b-v1,nvidia/nemotron-mini-4b-instruct",
        validation_alias=AliasChoices("NVIDIA_CODE_MODELS"),
    )
    openrouter_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("OPENROUTER_API_KEY"),
    )
    openrouter_model: str = Field(
        default="qwen/qwen3.6-plus:free",
        validation_alias=AliasChoices("OPENROUTER_MODEL", "OEPNROUTER_MODEL"),
    )
    openrouter_chat_models: str = Field(
        default=(
            "zai-org/glm-5:free,"
            "google/gemma-4-31b-it:free,"
            "minimax/minimax-m2.5:free,"
            "openai/gpt-oss-20b:free,"
            "openai/gpt-oss-120b:free,"
            "meta-llama/llama-3.3-70b-instruct:free,"
            "nvidia/nemotron-3-nano-30b-a3b:free,"
            "qwen/qwen3-coder:free,"
            "deepseek/deepseek-r1:free"
        ),
        validation_alias=AliasChoices("OPENROUTER_CHAT_MODELS"),
    )
    openrouter_code_models: str = Field(
        default=(
            "zai-org/glm-5:free,"
            "google/gemma-4-31b-it:free,"
            "minimax/minimax-m2.5:free,"
            "openai/gpt-oss-20b:free,"
            "openai/gpt-oss-120b:free,"
            "meta-llama/llama-3.3-70b-instruct:free,"
            "nvidia/nemotron-3-nano-30b-a3b:free,"
            "qwen/qwen3-coder:free,"
            "deepseek/deepseek-r1:free"
        ),
        validation_alias=AliasChoices("OPENROUTER_CODE_MODELS"),
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

    # ── OAuth SSO ──
    github_client_id: str | None = None
    github_client_secret: str | None = None
    google_client_id: str | None = None
    google_client_secret: str | None = None

    enable_docker_sandbox: bool = False
    docker_timeout_seconds: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
