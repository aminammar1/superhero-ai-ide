import hashlib
import math
import uuid
from typing import Annotated

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from common.config import get_settings
from common.security import create_access_token, get_subject_from_header

settings = get_settings()
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


class OAuthCallbackRequest(BaseModel):
    code: str
    redirect_uri: str | None = None


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


def _find_or_create_user(provider: str, username: str) -> UserProfile:
    """Find existing user by provider+username or create a new one."""
    user_id = f"{provider}-{username.lower()}"

    if user_id in USER_STORE:
        return USER_STORE[user_id]["profile"]

    # Create new user — they'll go through onboarding to pick hero theme
    profile = UserProfile(
        id=user_id,
        username=username,
        heroTheme="spiderman",
        avatar="spiderman",
        onboarded=False,
    )
    USER_STORE[user_id] = {
        "profile": profile,
        "embedding": [],
    }
    return profile


@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth"}


@app.post("/face/login")
async def face_login(payload: FaceLoginRequest):
    candidate_embedding = embed_image(payload.image_base64 or "demo-face")
    best_user_id = "hero-dev"
    best_score = -1.0
    for user_id, record in USER_STORE.items():
        if not record.get("embedding"):
            continue
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


# ═══════════════════════════════════════════════
#   OAUTH SSO — GitHub & Google
#   Lightweight: only fetches username, issues JWT
# ═══════════════════════════════════════════════

@app.post("/oauth/github/callback")
async def oauth_github_callback(payload: OAuthCallbackRequest):
    """Exchange GitHub OAuth code for access token, fetch username, issue JWT."""
    client_id = (settings.github_client_id or "").strip()
    client_secret = (settings.github_client_secret or "").strip()

    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="GitHub OAuth is not configured on the server.")

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Step 1: Exchange code for access token
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": payload.code,
            },
        )

        if token_response.is_error:
            raise HTTPException(status_code=502, detail=f"GitHub token exchange failed: HTTP {token_response.status_code}")

        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            error_desc = token_data.get("error_description", token_data.get("error", "Unknown error"))
            raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {error_desc}")

        # Step 2: Fetch user info (just username)
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )

        if user_response.is_error:
            raise HTTPException(status_code=502, detail="Failed to fetch GitHub user info.")

        github_user = user_response.json()
        username = github_user.get("login", f"github-user-{uuid.uuid4().hex[:8]}")

    # Step 3: Create/find user and issue JWT
    profile = _find_or_create_user("github", username)
    return {
        "access_token": create_access_token(profile.id),
        "token_type": "bearer",
        "user": profile.model_dump(),
    }


@app.post("/oauth/google/callback")
async def oauth_google_callback(payload: OAuthCallbackRequest):
    """Exchange Google OAuth code for access token, fetch username, issue JWT."""
    client_id = (settings.google_client_id or "").strip()
    client_secret = (settings.google_client_secret or "").strip()
    redirect_uri = (payload.redirect_uri or "").strip()

    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="Google OAuth is not configured on the server.")

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Step 1: Exchange code for access token
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": payload.code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )

        if token_response.is_error:
            raise HTTPException(status_code=502, detail=f"Google token exchange failed: HTTP {token_response.status_code}")

        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            error_desc = token_data.get("error_description", token_data.get("error", "Unknown error"))
            raise HTTPException(status_code=400, detail=f"Google OAuth error: {error_desc}")

        # Step 2: Fetch user info (just name)
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_response.is_error:
            raise HTTPException(status_code=502, detail="Failed to fetch Google user info.")

        google_user = user_response.json()
        # Use name or email prefix as username
        username = (
            google_user.get("name")
            or google_user.get("email", "").split("@")[0]
            or f"google-user-{uuid.uuid4().hex[:8]}"
        )

    # Step 3: Create/find user and issue JWT
    profile = _find_or_create_user("google", username)
    return {
        "access_token": create_access_token(profile.id),
        "token_type": "bearer",
        "user": profile.model_dump(),
    }
