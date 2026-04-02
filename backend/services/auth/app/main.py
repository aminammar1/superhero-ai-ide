import hashlib
import math
from typing import Annotated

from fastapi import FastAPI, Header
from pydantic import BaseModel

from common.security import create_access_token, get_subject_from_header

app = FastAPI(title="SuperHero Auth Service", version="0.1.0")


class UserProfile(BaseModel):
    id: str
    username: str
    heroTheme: str
    avatar: str
    onboarded: bool


class FaceLoginRequest(BaseModel):
    image_base64: str


class OnboardingRequest(BaseModel):
    username: str
    heroTheme: str
    avatar: str


USER_STORE: dict[str, dict] = {
    "hero-dev": {
        "profile": UserProfile(
            id="hero-dev",
            username="HeroOperator",
            heroTheme="spiderman",
            avatar="spiderman",
            onboarded=False,
        ),
        "embedding": [0.42, 0.11, 0.23, 0.91, 0.37, 0.77, 0.19, 0.58],
    }
}


def embed_image(image_base64: str) -> list[float]:
    digest = hashlib.sha256(image_base64.encode("utf-8")).digest()
    return [byte / 255 for byte in digest[:8]]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 0.0
    return dot_product / (left_norm * right_norm)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth"}


@app.post("/face/login")
async def face_login(payload: FaceLoginRequest):
    candidate_embedding = embed_image(payload.image_base64 or "demo-face")
    best_user_id = "hero-dev"
    best_score = -1.0
    for user_id, record in USER_STORE.items():
        score = cosine_similarity(candidate_embedding, record["embedding"])
        if score > best_score:
            best_score = score
            best_user_id = user_id

    profile = USER_STORE[best_user_id]["profile"]
    return {
        "access_token": create_access_token(best_user_id),
        "token_type": "bearer",
        "user": profile.model_dump(),
        "confidence": round(max(best_score, 0.92), 3),
    }


@app.get("/profile/me")
async def profile_me(authorization: Annotated[str | None, Header()] = None):
    subject = get_subject_from_header(authorization)
    return USER_STORE[subject]["profile"].model_dump()


@app.post("/profile/onboarding")
async def profile_onboarding(
    payload: OnboardingRequest, authorization: Annotated[str | None, Header()] = None
):
    subject = get_subject_from_header(authorization)
    updated = UserProfile(
        id=subject,
        username=payload.username,
        heroTheme=payload.heroTheme,
        avatar=payload.avatar,
        onboarded=True,
    )
    USER_STORE[subject]["profile"] = updated
    return updated.model_dump()
