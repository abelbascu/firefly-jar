# Changelog

## 2026-09-26 — Setup
- Scaffolded Vite (vanilla) + Phaser 3 (pinned ^3.90; an initial install pulled v4 and was corrected) + Playwright.
- Created folder structure, `CLAUDE.md`, `.env` / `.env.example`, `.gitignore` (merged with the Vite one).
- Prompt-logging hook (`.claude/log_prompt.py`, `settings.json`) -> `PROMPTS_VERBATIM.md`.
- Python venv + `requirements.txt` (regenerated as UTF-8; the first copy was UTF-16).
- `scripts/art.py` (gen / sheet / pick / import / list, chroma-key cutout with rembg fallback, sprite manifest) and `scripts/sfx.py` (gen / pick / list, ffmpeg loudnorm) with prompts in `art/prompts.yaml` and `audio/prompts.yaml`.
- Placeholder Phaser game (Preloader reads `sprites.json` / `audio.json`, MainScene shows firefly + jar), `tests/smoke.spec.js` (iPad landscape, touch) — passing.
- Reference art imported as v0 sprites: `firefly_yellow`, `firefly_green`, `firefly_pink`, `jar`. Sparkle burst, character sheet and concept image kept in `art/ref/`.
- GitHub Actions deploy + public repo + Pages: https://abelbascu.github.io/firefly-jar/
- Smoke tests: Gemini `gen firefly` (cutout verified) and ElevenLabs `gen catch` both work.

### Incidents / fixes
- A Gemini key pasted into `.env.example` was committed and pushed; Google auto-disabled it. Keys now live only in `.env`. The old key is still visible in commit `47868e1` (dead, history not yet rewritten).
- `sfx.py` created empty mp3s on failed API calls; now writes only after a successful response.
- Gemini image models need billing enabled (free-tier quota is 0).

## 2026-09-26 — Firefly style exploration
- Picked direction: v1-01 (detailed wings) was liked as a baseline; asked to explore rounder toddler styles.
- Added `style_extra` support to `art.py` and new prompt versions in `art/prompts.yaml`:
  v2 plush-blob (Teletubbies-like), v3 Pixar-inspired but flat 2D, v4 minimal sticker.
- The spec requires flat / rounded / non-photoreal, so "Pixar" is interpreted as charm and eyes, not 3D rendering.
- Contact sheet labels now show `vN-NN` (versions were ambiguous by number alone).

## Next
- Choose a firefly style, then generate the pose set (see below).
- Pose set to generate from the chosen sprite as reference (for consistency): flying/idle, wings-up, wings-down (2-frame flap),
  happy/caught, sleepy/resting; colour variants (yellow, green, pink) in the same style.

## 2026-09-26 — Rendered-style firefly tests
- Added per-version `style` override in `art.py` (replaces the global flat style) and prompt versions v5–v8:
  v5 3D Pixar-like render, v6 3D clay/plush toy, v7 2D illustration with rendered shading, v8 glossy 2D game-icon.
- Known issue: glowing abdomens (v5, v7-01, v8-02) pick up a magenta/pink fringe from the chroma-key background;
  glow should be drawn in code anyway (see CLAUDE.md). Fix if one of these is chosen: prompt "no glow" + tighter despill.
