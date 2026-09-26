# Firefly Jar — Phaser 3 + Vite, plain JS

## The game
Night garden, fireflies drift in soft wandering paths. Child taps one → it floats gently
into a glass jar → jar gets brighter. At 10 fireflies: jar glows, sparkles, happy sound,
then the round resets. Plus ONE small original mechanic (decided later, see DESIGN_NOTE.md).

## Hard rules (spec)
- Audience 4–7, tablet-first; must work with touch AND mouse.
- NO fail states, NO timers, NO "game over", nothing is ever lost.
- NO text in the UI — everything must work for a pre-reader.
- Big touch targets: hit area ≥ 96px diameter, larger than the sprite (invisible circle).
- Calm pacing: slow eased motion only (Sine/Quad easing), never frantic, no flashing.
- Style: flat, rounded shapes, no hard edges, no photorealism, soft glow on fireflies + jar.

## Palette (use ONLY these, defined once in src/config.js)
night #2B3A67 · glow #FFD166 · leaves #7BC47F · accent #F4A6B7 · jar/highlight #FFF4E0

## Engineering conventions
- Glow is drawn in code (additive-blend soft circles / Phaser FX), never baked into PNGs.
- Sprites are loaded ONLY via public/sprites/sprites.json keys; never hardcode filenames.
  Audio likewise via public/audio/audio.json. Swapping an asset must need zero code change.
- Small modules: scenes/, objects/Firefly.js, objects/Jar.js, config.js for all tuning numbers.
- Scale mode FIT, base resolution 1024x768 (iPad landscape); also sane on portrait/phone.
- Vite `base` must stay '/firefly-jar/' for GitHub Pages.
- Phaser must stay on v3 (^3.x), not v4.
- Windows: use `python` (not `python3`); write text files as UTF-8 (no PowerShell `>` redirects).

## Asset pipelines
- Art: `python scripts/art.py gen|sheet|pick|import|list` — prompts in art/prompts.yaml.
- Audio: `python scripts/sfx.py gen|pick|list` — prompts in audio/prompts.yaml.
- When the user says e.g. "firefly: 4" → run `art.py pick firefly 4`.
- Never edit prompts.yaml entries that were already used; add a new version (v2, v3…)
  so the history stays in the log.

## Workflow
- One feature per step. After each feature: `npx playwright test`, look at the screenshot
  in test-results/, fix visual problems before moving on.
- After each feature, append 3–6 lines to PROCESS_LOG.md: what was built, what the AI got
  wrong, how it was corrected, approx time spent.
- Commit after each working feature with a clear message.
