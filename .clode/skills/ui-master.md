# Skill: ui-master

## Purpose
Apply modern UI best practices to this superhero IDE while protecting product identity.

## Core UI Standards
1. Use a clear hierarchy with intentional spacing and readable typography.
2. Keep interaction feedback immediate for buttons, tabs, switches, and editor actions.
3. Design for desktop first, then validate responsive behavior on smaller screens.
4. Maintain accessibility basics: contrast, keyboard navigation, labels, focus states.
5. Prefer consistency over novelty in repeated controls.

## IDE Panel Rules
1. Treat top bar, file explorer, editor panel, agent panel, terminal output, settings panel, and status bar as stable layout primitives.
2. Preserve panel roles. Do not swap responsibilities between panels.
3. Keep editing flow uninterrupted. Secondary actions should not block editor interaction.
4. Preserve quick visual scan: navigation left, work center, assistant and outputs right or lower regions as designed.

## Hero Branding Rules
1. Use real hero logos from local assets when available.
2. Respect active hero theme colors when rendering controls, highlights, badges, and avatar areas.
3. Keep logo usage tasteful. Avoid oversized decorative logos that reduce usability.
4. If assets are missing, web search may be used for references, then user approval is required before introducing licensed files.

## Implementation Habits
1. Reuse existing UI components in `frontend/components/ui` before adding new primitives.
2. Keep styles token driven and theme aware.
3. Validate visual changes against all hero themes.
4. Prefer incremental PR sized changes with clear reasoning.
