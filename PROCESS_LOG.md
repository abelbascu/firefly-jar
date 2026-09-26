# Process Log
## Tools & why
## Timeline (approx.)
| Time | Activity | Minutes |
|---|---|---|
## Entries
## Where the AI got it wrong (and the fix)
- Setup: `npm install phaser` pulled Phaser v4; spec requires v3 — pinned to ^3.90.
- Setup: `requirements.txt` was written as UTF-16 by a PowerShell redirect; re-generated as UTF-8.
## Time split
## With more time I would…

ART: imported firefly_yellow from firefly_yellow.png (2026-09-26)

ART: imported firefly_green from firefly_green.png (2026-09-26)

ART: imported firefly_pink from firefly_pink.png (2026-09-26)

ART: imported jar from jar.png (2026-09-26)

## Setup notes
- Setup (~1h): scaffold, pipelines, hook, deploy.
- AI/agent mistake: committed `.env.example` after the user pasted a real Gemini key into it -> key leaked to the public repo, Google auto-disabled it. Fix: rotate key; keys only ever go in `.env`.
- Gemini image API needed billing enabled (free tier quota 0). ElevenLabs: key ID vs secret (`sk_`) confusion.
- `sfx.py` left empty mp3s on failed calls; fixed to write only after a successful response.

ART: picked firefly v6_02 (gemini-3.1-flash-image, 2026-09-26)

BUILD 1: Firefly.js — Sine-eased wandering legs with hover pauses, flap-frame support (falls back to the single sprite until side frames exist), invisible 112px tap circle, code-drawn additive pulsing glow (glow.js). Smoke test + screenshot OK. ~15 min.
