# Skill: ascii-cli-master

## Purpose
Generate high-quality ASCII art and terminal visuals for the SuperHero AI IDE terminal boot screens and CLI branding.

## ASCII Art Rules
1. Use only standard box-drawing Unicode characters and ASCII for terminal art.
2. Keep ASCII logos compact enough to render without horizontal scroll in a 90-column terminal pane.
3. Each hero logo must include: hero name in block letters, a recognizable hero icon or symbol, and a version/tagline line.
4. Avoid oversized full-width banner art. Prefer 60-80 column width maximum.
5. Test that all art renders cleanly in monospace fonts at 10-12px size.

## Hero Symbol Guidelines
1. Spider-Man: web pattern, angular spider shape, use forward and back slashes for web lines.
2. Batman: bat-wing silhouette, angular geometry, strong horizontal spread.
3. Superman: S-shield outline, diamond shape framing the S.
4. Iron Man: helmet/faceplate shape, arc reactor circle, HUD box framing.

## Terminal Boot Sequence
1. Show ASCII logo first.
2. Follow with a thin separator line (using dashes or box-drawing).
3. Show 3 status lines: system init, sandbox ready, agent connected.
4. End with a hint line pointing to the help command.

## Quality Checklist
1. Verify no characters extend beyond column 80.
2. Verify vertical height stays under 12 lines for the logo block.
3. Verify the art is legible when the terminal font is small.
4. Prefer clean geometric shapes over noisy dense fills.
