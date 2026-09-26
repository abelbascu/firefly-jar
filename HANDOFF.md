# Handoff — resume in Claude Code VS Code extension

Source spec: `C:\Users\camin\Desktop\FIREFLY_JAR_SETUP.md` (execute top to bottom, stop before
building the actual game — end checklist is section 11).

## Environment facts (already verified, don't re-check)
- Node v22.13.0 — OK (need >=20)
- Python 3.13.1 — installed as `python`, **not** `python3` (Windows). Use `python` in all
  commands/venv activation for section 6.
- git 2.43.0, gh 2.90.0 — both present
- `gh auth status` → already logged in as **abelbascu**, scopes include repo/workflow — section 1
  HUMAN step 1 (`gh auth login`) is done, skip it.
- ffmpeg present — OK for section 8.2 loudness normalization.
- Reference images folder path: **not yet provided by user** — ask before doing section 7.6 / task
  "Import reference art images".
- Gemini + ElevenLabs API keys: user says ready to paste in once `.env` exists — create
  `.env`/`.env.example` (section 3) and prompt them to paste keys, don't ask for the key values
  in chat.

## Done so far
- `npm create vite@latest firefly-jar -- --template vanilla` scaffolded at
  `C:\Users\camin\Desktop\firefly-jar`
- `npm install`, `npm install phaser@^3` (⚠ first `npm install phaser` pulled v4 — corrected to
  `^3` per spec's "Phaser 3 + Vite" requirement — verify `package.json` still says phaser ^3.x),
  `npm install -D @playwright/test`

## Not done yet (in order, per setup doc)
1. `npx playwright install chromium` — not run
2. `git init -b main` — not run, **no git repo yet**
3. Create empty folders w/ `.gitkeep` per the target structure (section 2)
4. Section 3 — `.env`, `.env.example`, append to `.gitignore` (a `.gitignore` already exists
   from vite scaffold — merge, don't overwrite)
5. Section 4 — `CLAUDE.md`
6. Section 5 — prompt-logging hook (`.claude/log_prompt.py`, `.claude/settings.json`,
   `PROMPTS_VERBATIM.md`), tell user to restart Claude Code after creating it and verify a
   prompt gets logged
7. Section 6 — Python venv (`python -m venv .venv`), pip installs, `requirements.txt`, npm
   script shortcuts in `package.json`
8. Section 7 — `scripts/art.py` + `art/prompts.yaml` (full spec in the doc: gen/sheet/pick/
   import/list, chroma-key cutout algorithm, sprites.json manifest)
9. Section 8 — `scripts/sfx.py` + `audio/prompts.yaml`
10. Section 9 — `vite.config.js` (base `/firefly-jar/`), `.github/workflows/deploy.yml`,
    `gh repo create firefly-jar --public --source=. --push`, enable Pages via `gh api`
11. Section 10 — placeholder Phaser scene, `tests/smoke.spec.js`, `playwright.config.js`,
    `PROCESS_LOG.md`, `DESIGN_NOTE.md`, `README.md`
12. Section 7.6 — copy reference images into `art/ref/`, `import` firefly_yellow/green/pink +
    jar as v0 sprites, `gen firefly --n 2` smoke test (needs Gemini key + reference image path)
13. Section 8.4 — `gen catch --n 2` audio smoke test (needs ElevenLabs key)
14. Section 11 — run end checklist, report to user, then stop and wait for first build
    instruction

## Task tracker
A task list (IDs 1–12) already exists in this session covering the above — the new session can
recreate an equivalent list or just work through the numbered steps here directly.

## Notes / decisions already made (don't re-litigate)
- Stack is fixed per section 0 table (Phaser 3 + Vite + plain JS, Gemini Nano Banana for art,
  ElevenLabs for audio, Playwright tests, GitHub Pages). Don't suggest alternatives.
- Repo must stay **public** (GitHub free plan Pages requirement).
- Never print/log/commit API keys.
