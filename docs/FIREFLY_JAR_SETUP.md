# Firefly Jar — Project Setup Instructions (for Claude Code)

> **For the agent:** Execute this document top to bottom. It sets up the repo, tooling,
> API keys, the AI asset pipelines (art + audio), prompt logging and GitHub Pages deploy.
> **Do not build the game itself yet** — stop at the end checklist and report back.
> Where a step says **HUMAN**, pause and ask the user to do it, then continue.
> Never print, log or commit API keys.

---

## 0. Context

Take-home assignment: build **Firefly Jar**, a calm one-screen web game for kids aged 4–7.
Time box is 4 hours total, so setup must be fast and scripted. Evaluation weighs the AI
process heavily, so every prompt (code, art, audio) must be captured verbatim.

Stack decisions (already made — don't re-litigate):

| Area | Choice |
|---|---|
| Engine | Phaser 3 + Vite, plain JavaScript (no TypeScript) |
| Image generation | Google Gemini API — Nano Banana 2 (`gemini-3.1-flash-image`), Nano Banana Pro (`gemini-3-pro-image`) for hard character-consistency shots |
| Background removal | Chroma-key (auto-detected flat background) with `rembg` as fallback, all local |
| Audio | ElevenLabs API (sound effects + optional music loop) |
| Tests | Playwright (tablet viewport, touch) |
| Hosting + repo | GitHub (public repo) + GitHub Pages via GitHub Actions |
| Not used | Recraft, Vercel, Railway, Neon |

---

## 1. Prerequisites

Check each and install what's missing (ask before installing system-wide):

```bash
node -v        # need >= 20
python3 -V     # need >= 3.10
git --version
gh --version   # GitHub CLI
ffmpeg -version  # optional: audio trimming/normalising
```

**HUMAN steps:**
1. `gh auth login` (GitHub.com → HTTPS → login with browser).
2. Get a **Gemini API key**: https://aistudio.google.com/apikey — image models may require billing enabled on the Google Cloud project.
3. Get an **ElevenLabs API key**: https://elevenlabs.io → Profile → API Keys (enable Sound Effects + Music permissions).
4. Tell the agent the folder path containing the existing reference images (firefly yellow/green/pink, jar, sparkle burst, character sheet).

---

## 2. Create the project

```bash
npm create vite@latest firefly-jar -- --template vanilla
cd firefly-jar
npm install
npm install phaser
npm install -D @playwright/test
npx playwright install chromium
git init -b main
```

Target folder structure (create empty folders with `.gitkeep`):

```
firefly-jar/
├─ CLAUDE.md                 # project rules (section 4)
├─ PROMPTS_VERBATIM.md       # auto-filled by hook (section 5)
├─ PROCESS_LOG.md            # human-readable log (section 10)
├─ DESIGN_NOTE.md            # ≤ half page (section 10)
├─ .env / .env.example
├─ .claude/settings.json + log_prompt.py
├─ .github/workflows/deploy.yml
├─ art/
│  ├─ prompts.yaml           # ALL art prompts live here (source of truth + log evidence)
│  └─ ref/                   # reference images (style/character anchors)
├─ audio/
│  └─ prompts.yaml           # ALL audio prompts live here
├─ assets/
│  ├─ _candidates/<key>/     # generated options, NOT deployed (gitignored except sheets)
│  └─ _archive/<key>/        # replaced sprite versions
├─ public/
│  ├─ sprites/               # final game-ready PNGs + sprites.json manifest
│  └─ audio/                 # final game-ready audio + audio.json manifest
├─ scripts/
│  ├─ art.py
│  └─ sfx.py
├─ src/
│  ├─ main.js
│  ├─ config.js              # palette, tuning constants
│  ├─ scenes/
│  └─ objects/
└─ tests/
   └─ smoke.spec.js
```

---

## 3. Secrets

`.env` (real values, never committed):
```
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
```
`.env.example` (committed, empty values, same keys).

`.gitignore` — append:
```
.env
.venv/
assets/_candidates/**/*.png
assets/_candidates/**/*.mp3
!assets/_candidates/**/_sheet.png
test-results/
playwright-report/
```

Ask the user to paste the keys into `.env` themselves (don't request them in chat).

---

## 4. CLAUDE.md (create with this content)

```markdown
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
```

---

## 5. Automatic verbatim prompt logging (Claude Code hook)

`.claude/log_prompt.py`:
```python
import sys, json, datetime, pathlib
data = json.load(sys.stdin)
prompt = data.get("prompt", "")
log = pathlib.Path(__file__).resolve().parent.parent / "PROMPTS_VERBATIM.md"
with log.open("a", encoding="utf-8") as f:
    f.write(f"\n### {datetime.datetime.now():%Y-%m-%d %H:%M} — Claude Code\n```\n{prompt}\n```\n")
```

`.claude/settings.json`:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "python3 .claude/log_prompt.py" } ] }
    ]
  }
}
```

`PROMPTS_VERBATIM.md` header:
```markdown
# Prompts (verbatim)
Code prompts are appended automatically by a Claude Code hook.
Art prompts: see art/prompts.yaml (the scripts read prompts ONLY from there).
Audio prompts: see audio/prompts.yaml.
Prompts used outside VS Code (e.g. the original reference images) are pasted manually below.
```

Tell the user: restart Claude Code after creating the hook, then verify one prompt gets logged.

---

## 6. Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install google-genai "rembg[cpu]" pillow numpy pyyaml python-dotenv elevenlabs
pip freeze > requirements.txt
```

Add npm shortcuts to `package.json` scripts:
```json
"art": "python scripts/art.py",
"sfx": "python scripts/sfx.py",
"test": "playwright test"
```

---

## 7. Art pipeline — `scripts/art.py`

### 7.1 `art/prompts.yaml` (starter content)

```yaml
style: >
  Flat 2D children's game asset, soft rounded shapes, no hard edges, no photorealism,
  thick soft dark-navy outline, gentle pastel shading, cute and calm, for ages 4-7.
  Palette strictly: night blue #2B3A67, firefly glow #FFD166, leaf green #7BC47F,
  pink accent #F4A6B7, cream highlight #FFF4E0.
  Single centered subject, full body visible, generous empty margin around it.
  Plain flat solid pure magenta #FF00FF background, no shadow on the background,
  no gradient, no text, no border, no glow halo around the subject.

assets:
  firefly:
    v1:
      model: gemini-3.1-flash-image
      refs: [art/ref/firefly_yellow.png, art/ref/character_sheet.png]
      prompt: >
        The same firefly character as the reference: round navy head, two antennae with
        ball tips, rosy cheeks, small smile, translucent cream-outlined wings, glowing
        yellow abdomen. Gentle flying pose, three-quarter view.
      out_px: 256
  jar:
    v1:
      model: gemini-3.1-flash-image
      refs: [art/ref/jar.png]
      prompt: >
        Empty rounded glass mason jar, lid resting open and tilted on top, drawn as
        cream #FFF4E0 rounded outlines with a soft translucent body and one highlight
        stroke. Front view, no contents, clean edges.
      out_px: 512
  background:
    v1:
      model: gemini-3.1-flash-image
      refs: []
      no_cutout: true
      aspect: "4:3"
      prompt: >
        Calm night garden game background, 4:3 landscape, dark navy sky #2B3A67,
        soft rounded bushes and grass in #7BC47F along the bottom third, a few tiny
        distant dots of light, large empty open space in the middle for gameplay,
        flat shapes, no characters, no jar, no text.
      out_px: 2048
```

(Note: the style block's magenta-background line is skipped for `no_cutout` assets — the
script must build the prompt as `style_without_bg_lines + prompt` for those.)

### 7.2 Commands the script must implement

| Command | Behaviour |
|---|---|
| `gen <key> [--version v1] [--n 6] [--pro]` | Loads `.env`, builds prompt = `style` + asset prompt, attaches `refs` images, calls Gemini `n` times (sequentially, with retry/backoff on 429/5xx). `--pro` overrides model to `gemini-3-pro-image`. Saves raw outputs to `assets/_candidates/<key>/<version>_<NN>.png`, then runs `sheet`. |
| `sheet <key>` | Builds `assets/_candidates/<key>/_sheet.png`: grid of all candidates, each shown **after cutout** on a navy #2B3A67 tile (so the user judges the real in-game look), with a large readable number label. Tell the user the path so they can open it in VS Code. |
| `pick <key> <NN> [--version v1]` | Cutout → trim to alpha bbox → pad 8% → resize so longest side = `out_px` (and write an `@2x` version at double size) → save `public/sprites/<key>.png` (+ `<key>@2x.png`). If a sprite already exists, move it to `assets/_archive/<key>/<timestamp>.png` first. Update `public/sprites/sprites.json`. Append a line to PROCESS_LOG.md: `ART: picked <key> <version>_<NN> (model, date)`. |
| `import <key> <path>` | Registers an existing image (the user's current reference PNGs) as a sprite via the same trim/resize/manifest path; cutout only if the image has no transparency. |
| `list` | Prints the manifest: key → file, version, source, date. |

### 7.3 Gemini call (reference implementation — verify against current docs if it errors)

Docs: https://ai.google.dev/gemini-api/docs/image-generation

```python
from google import genai
from google.genai import types
from PIL import Image
import io

client = genai.Client()  # reads GEMINI_API_KEY from env
contents = [full_prompt] + [Image.open(p) for p in refs]
resp = client.models.generate_content(
    model=model,
    contents=contents,
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio=aspect or "1:1"),
    ),
)
for part in resp.candidates[0].content.parts:
    if getattr(part, "inline_data", None):
        Image.open(io.BytesIO(part.inline_data.data)).save(out_path)
```

### 7.4 Cutout algorithm (in `pick`/`sheet`)

1. **Detect the background colour** by sampling the four corners/borders (median). Don't
   assume exact #FF00FF — the model won't hit it exactly.
2. **Chroma-key:** alpha = smoothstep on colour distance from the bg colour (soft edge,
   ~2px feather), flood-filled from the borders only (so interior pixels of similar colour
   are kept).
3. **Despill:** on semi-transparent edge pixels, remove the bg colour tint.
4. **Fallback:** if the border isn't uniform (std dev above threshold) or the flag
   `--method rembg` is given, use `rembg` (`new_session("isnet-general-use")`) instead.
5. Translucent wings/glass: keep partial alpha, don't binarise.
6. If the image already has meaningful transparency, skip cutout.

### 7.5 `public/sprites/sprites.json` format

```json
{
  "firefly": { "file": "firefly.png", "file2x": "firefly@2x.png", "version": "v1_04", "source": "gemini-3.1-flash-image", "date": "2026-09-26" }
}
```
The game's Preloader scene reads this manifest and loads every key (use the @2x file when
`devicePixelRatio > 1`). Swapping art = `art.py pick` → Vite hot-reloads → done.

### 7.6 First run (do this as part of setup)

1. Copy the user's reference images into `art/ref/` with clear names
   (`firefly_yellow.png`, `firefly_green.png`, `firefly_pink.png`, `jar.png`,
   `sparkle_burst.png`, `character_sheet.png`).
2. `import` the three fireflies and the jar as v0 sprites (keys: `firefly_yellow`,
   `firefly_green`, `firefly_pink`, `jar`) so the game has usable art from minute one.
3. Run `gen firefly --n 2` as a smoke test to confirm the API works (cheap), show the sheet
   path, and **don't pick** — the user will decide.

Known issues in the existing art (record in PROCESS_LOG.md as "AI output issues"):
- The character sheet's palette section lists #FFF4E0 twice under different names ("Highlights" and "Warm").
- The jar PNG has a dark smudge at the bottom and a pale halo around the outline.
- The sparkle burst sits on an opaque grey background → will be replaced by code particles.
- The firefly PNGs are ~900px tall → must be downscaled (import handles this).

---

## 8. Audio pipeline — `scripts/sfx.py`

### 8.1 `audio/prompts.yaml` (starter content)

```yaml
style: >
  Gentle, soft, warm, for a calm toddler game at night. No harsh transients,
  no loud bass, no scary tones, no voices.

sounds:
  catch:
    v1: { type: sfx, seconds: 0.8, prompt: "a single soft glass chime twinkle, like a firefly landing in a glass jar" }
  jar_fill:
    v1: { type: sfx, seconds: 1.0, prompt: "soft rising magical shimmer, one gentle sparkle" }
  celebrate:
    v1: { type: sfx, seconds: 3.0, prompt: "happy gentle celebration jingle, music box and soft bells, short and joyful" }
  tap_miss:
    v1: { type: sfx, seconds: 0.4, prompt: "very soft muted bubble pop, barely there" }
  ambience:
    v1: { type: music, seconds: 60, prompt: "calm lullaby night garden loop, soft music box and gentle crickets, slow tempo, seamless loop" }
```

### 8.2 Commands

| Command | Behaviour |
|---|---|
| `gen <key> [--version v1] [--n 4]` | Calls ElevenLabs (sound effects for `type: sfx`, music for `type: music`) `n` times → `assets/_candidates/sfx/<key>/<version>_<NN>.mp3`. Prints the paths (the user plays them from the VS Code explorer). |
| `pick <key> <NN>` | Optional ffmpeg: trim leading silence, normalise loudness (`loudnorm` to about −18 LUFS for sfx, −24 for ambience), fade out 50ms. Copy to `public/audio/<key>.mp3`, archive the previous one, update `public/audio/audio.json`, append to PROCESS_LOG.md. |
| `list` | Prints the audio manifest. |

### 8.3 ElevenLabs calls (reference — verify method names against the installed SDK version)

```python
from elevenlabs.client import ElevenLabs
client = ElevenLabs()  # reads ELEVENLABS_API_KEY
# Sound effect
audio = client.text_to_sound_effects.convert(
    text=f"{style} {prompt}", duration_seconds=seconds, prompt_influence=0.5)
# Music (if available on the account's plan)
audio = client.music.compose(prompt=f"{style} {prompt}", music_length_ms=seconds * 1000)
with open(out_path, "wb") as f:
    for chunk in audio:
        f.write(chunk)
```

If music generation isn't available on the plan, skip `ambience` and tell the user.

**Optional alternative:** the ElevenLabs MCP server
(`claude mcp add elevenlabs -e ELEVENLABS_API_KEY=... -- uvx elevenlabs-mcp`). The script is
preferred because it's reproducible and keeps prompts in the repo.

### 8.4 First run
`gen catch --n 2` as a smoke test. Don't pick.

---

## 9. GitHub repo + Pages deploy

1. `vite.config.js`:
   ```js
   import { defineConfig } from 'vite';
   export default defineConfig({ base: '/firefly-jar/', server: { host: true } });
   ```
   (`host: true` lets the user open the dev server on a tablet on the same Wi-Fi.)
2. `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push: { branches: [main] }
     workflow_dispatch:
   permissions: { contents: read, pages: write, id-token: write }
   concurrency: { group: pages, cancel-in-progress: true }
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20, cache: npm }
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with: { path: dist }
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4
   ```
3. Create the repo and enable Pages:
   ```bash
   git add -A && git commit -m "Project setup: Vite + Phaser, asset pipelines, CI deploy"
   gh repo create firefly-jar --public --source=. --push
   gh api -X POST "repos/{owner}/firefly-jar/pages" -f build_type=workflow
   ```
   (Replace `{owner}` with the output of `gh api user -q .login`. If Pages already exists,
   use `-X PUT`.)
4. Wait for the Action (`gh run watch`), then print the live URL:
   `https://<owner>.github.io/firefly-jar/`.

The free GitHub plan supports Pages on **public** repos only — keep the repo public.

---

## 10. Placeholder game + docs

- **Placeholder game** (so deploy + tests have something real): Phaser boots, a Preloader
  loads `sprites.json` + `audio.json`, the main scene fills the screen with #2B3A67 and shows
  the imported `firefly_yellow` sprite bobbing slowly in the centre, plus the jar at the
  bottom. Nothing more.
- **`tests/smoke.spec.js`**: iPad landscape (1024×768, `hasTouch: true`), loads the page,
  asserts the canvas exists and there are no console errors, takes a screenshot at
  `test-results/smoke.png`. Configure `playwright.config.js` with `webServer: npm run dev`.
- **`PROCESS_LOG.md`** template:
  ```markdown
  # Process Log
  ## Tools & why
  ## Timeline (approx.)
  | Time | Activity | Minutes |
  ## Entries
  ## Where the AI got it wrong (and the fix)
  ## Time split
  ## With more time I would…
  ```
- **`DESIGN_NOTE.md`** template (≤ half a page): *Added mechanic & why · What I'd build next ·
  What I deliberately cut.*
- **`README.md`**: one-line description, live link, `npm install && npm run dev`, how to
  regenerate assets (`npm run art -- gen firefly`).

---

## 11. End checklist — report each item to the user, then STOP

- [ ] `npm run dev` serves the placeholder; LAN URL printed for tablet testing
- [ ] `npx playwright test` passes; screenshot path shown
- [ ] Prompt-logging hook writes to PROMPTS_VERBATIM.md (verified after restart)
- [ ] `.env` is git-ignored; `git log -p` contains no keys
- [ ] `art.py import` done for the existing fireflies + jar; `sprites.json` valid
- [ ] `art.py gen firefly --n 2` worked; `_sheet.png` path shown
- [ ] `sfx.py gen catch --n 2` worked; mp3 paths shown
- [ ] Repo is public on GitHub; the Pages Action is green; live URL works on the phone/tablet
- [ ] Time spent on setup is logged in PROCESS_LOG.md

Then wait for the user's first build instruction (core loop).
