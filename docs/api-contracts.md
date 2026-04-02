# API Contracts

## Gateway

### `POST /api/auth/face-login`

Request:

```json
{
  "image_base64": "data:image/jpeg;base64,..."
}
```

Response:

```json
{
  "access_token": "jwt",
  "token_type": "bearer",
  "confidence": 0.97,
  "user": {
    "id": "hero-dev",
    "username": "HeroOperator",
    "heroTheme": "spiderman",
    "avatar": "spiderman",
    "onboarded": false
  }
}
```

### `POST /api/profile/onboarding`

Headers:

```text
Authorization: Bearer <jwt>
```

Request:

```json
{
  "username": "CaptainDev",
  "heroTheme": "batman",
  "avatar": "batman"
}
```

### `POST /api/chat/stream`

Request:

```json
{
  "prompt": "How should we structure a FastAPI gateway?",
  "heroTheme": "ironman",
  "history": [
    { "role": "user", "content": "Previous message" }
  ]
}
```

Response:

`text/plain` stream with incremental chunks.

### `POST /api/code/generate`

Request:

```json
{
  "prompt": "Build me a REST API in Go",
  "language": "go",
  "heroTheme": "superman"
}
```

Response:

```json
{
  "language": "go",
  "code": "package main ...",
  "explanation": "Generated through the AI service with fallback logic enabled."
}
```

### `POST /api/voice/tts`

Request:

```json
{
  "text": "Systems online.",
  "heroTheme": "batman"
}
```

Response:

`audio/mpeg` stream.

### `POST /api/execute/run`

Request:

```json
{
  "language": "python",
  "code": "print('hello')"
}
```

Response:

```json
{
  "stdout": "hello\n",
  "stderr": "",
  "exit_code": 0,
  "language": "python",
  "duration_ms": 38
}
```
