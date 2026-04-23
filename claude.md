# SuperHero AI IDE Claude Instructions

## Mission
Build and maintain this repository as a split frontend and backend application while preserving the superhero IDE experience.

## Project Map
1. Frontend code lives in `frontend/`.
2. Backend microservices live in `backend/`.
3. Shared operational files can stay at repository root.

## Coding Rules
1. Keep responses concise and direct.
2. Do not write code or comments with emoji.
3. Keep code clean and readable with clear naming.
4. Avoid unnecessary complexity and duplicate logic.
5. In README files, do not use hyphen bullet markers.

## Delivery Rules
1. Run a final code review pass before finishing.
2. Skip browser testing. The user validates browser behavior manually.
3. If a bug was fixed, add a short reusable note to memory when useful.

## UI and Product Rules
1. Respect current hero themes and theme colors.
2. Keep IDE panel layout consistent with app behavior.
3. Use real hero logo assets when available in the repository.
4. If needed assets are missing, search the web for references and ask the user before adding licensed material.

## Architecture Intent
1. Frontend should focus on IDE panels, hero visuals, and interaction quality.
2. Backend should keep services modular: gateway, auth, ai, voice, executor.
3. Keep integration points explicit and environment driven.
