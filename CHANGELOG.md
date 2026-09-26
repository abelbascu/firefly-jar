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

## 2026-09-26 — Firefly v6_02 chosen + pose set
- Picked `firefly` = v6_02 (soft clay/plush, cute, not adult-looking) -> `public/sprites/firefly.png`. Raw candidate saved as `art/ref/firefly_v6_02.png` (reference for all poses).
- `art.py`: added `group` support so derived sets live in `assets/_candidates/<group>/<key>/`.
- Pose set generated into `assets/_candidates/firefly_v6_02_poses/`: idle, wings_up, wings_down, happy, sleepy + green/pink colour variants (2 candidates each; `_overview.png` shows all).
- Design decisions from feedback: wings are semi-transparent; the glowing part is a translucent, shaded egg/bulb-like orb the firefly sits in (so glow can be layered in code).
- Not yet picked.
- Side-view flap frames (facing right; mirror in code for left) generated into `assets/_candidates/firefly_v6_02_poses/side/`:
  `firefly_side_wings_up|mid|down` (3 candidates each). Loop order: up, mid, down, mid.

## 2026-09-26 — Layered side-view flap (replaces per-frame side poses)
- Problem: frames generated independently made the body jump up/down between frames (bad for ages 4-7).
- New approach: static body (`firefly_side_body`, wings removed) + one wing sprite (`firefly_side_wing`, left half of a generated wing pair)
  rotated around a hinge in code with Sine easing. Body never moves; flap range ~ -30deg..+58deg; far wing drawn dimmer/offset behind.
- Manifest data for the game: `firefly_side_body.hingeX/hingeY` (hinge as a fraction of the body sprite), `firefly_side_wing.originX/originY`
  (wing sprite origin = hinge). Both wings render BEHIND the body. Face left with flipX.
- `scripts/side_layers.py preview|install`; preview GIF: `assets/_candidates/firefly_v6_02_poses/side/gifs/layered_flap.gif`.
- `art.py` cutout: 2px edge erosion (less magenta fringe) and higher trim threshold (a faint speck was inflating the bbox).
- Next: antenna wiggle (separate antenna layers), then colour variants of the layers.

## 2026-09-26 — Flap v2 (3D-ish, independent wings) kept for now
- Wings now flap independently: each is a textured plane rotated in depth about the body axis + swung in-plane, perspective-projected; near/far wing have different phase/amplitude. Body static.
- Accepted as "good enough for now"; polish at the end (ideas: real generated near/far wing frames with painted perspective, more natural wing shape, antenna wiggle).
- Baked into game-ready frames: sprite keys `firefly_side_flap_00`..`_11` (facing right, identical size/anchor, 12-frame loop ~70ms/frame, flipX for left). Regenerate with `python scripts/side_layers.py frames`.

## 2026-09-26 — Front poses kept, cleanup
- Picked front-facing poses (idle 2, wings_up 2, wings_down 2, happy 2, sleepy 1, alt_green 2, alt_pink 2) into `public/sprites/`.
- Archived unused work to `assets/_archive/`: `exploration/firefly_style_tests` (v1-v5, v7-v8), `exploration/side_per_frame` (per-frame side poses + old GIFs), `sprites_unused` (v0 fireflies yellow/green/pink, layer sprites). Manifest cleaned.
- `HANDOFF.md` -> `docs/archive/`; duplicate assignment docx -> `docs/archive/`.
- New `docs/ASSETS.md` lists the approved asset keys for the game code.

## 2026-09-26 — Planning session log added
- Added `docs/PLANNING_SESSION_LOG.md` (pre-build conversation from the Claude desktop app) and `docs/FIREFLY_JAR_SETUP.md` (the setup spec it produced).
- `PROMPTS_VERBATIM.md` now has Part A (desktop-app prompts, verbatim) and Part B (VS Code hook entries).
