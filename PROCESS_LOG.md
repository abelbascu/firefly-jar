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

BUILD 2+3: Jar.js (sprite + code glow that brightens 0..10, small glowing orbs rest inside) and catch (bezier curve, scale down, soft sound if audio exists, replacement firefly fades in elsewhere). Test taps a firefly and asserts jar count 1 via window.__game hook. Got wrong: first draft of test would have needed moving-target care; solved by reading live position. ~20 min.

BUILD 4: Celebration at 10 — jar swell, code-drawn additive sparkle particles (old sparkle art not used), happy pose + celebrate sound when those assets exist, calm fade reset. Test drives 10 catches and asserts reset. ~10 min.

BUILD 5+6: "Call the fireflies" mechanic (tap empty night -> ripple + nearby fireflies drift over), DESIGN_NOTE.md, code-drawn background (moon, twinkling stars, bushes; uses 'background' sprite if present). First bush draft had translucent overlapping discs that looked muddy; redrawn opaque + night overlay. Portrait/phone: FIT scaling letterboxes the 4:3 stage, still playable. ~15 min.

ART: picked firefly_pose_idle v1_02 (gemini-3.1-flash-image, 2026-09-26)

ART: picked firefly_pose_wings_up v1_02 (gemini-3.1-flash-image, 2026-09-26)

ART: picked firefly_pose_wings_down v1_02 (gemini-3.1-flash-image, 2026-09-26)

ART: picked firefly_pose_happy v1_02 (gemini-3.1-flash-image, 2026-09-26)

ART: picked firefly_pose_sleepy v1_01 (gemini-3.1-flash-image, 2026-09-26)

ART: picked firefly_alt_green v1_02 (gemini-3.1-flash-image, 2026-09-26)

ART: picked firefly_alt_pink v1_02 (gemini-3.1-flash-image, 2026-09-26)

AUDIO: picked catch v1_03 (elevenlabs sfx, 2026-09-26)

AUDIO: picked jar_fill v1_01 (elevenlabs sfx, 2026-09-26)

AUDIO: picked celebrate v1_01 (elevenlabs sfx, 2026-09-26)

AUDIO: picked tap_miss v2_01 (elevenlabs sfx, 2026-09-26)

AUDIO: picked ambience v2_01 (elevenlabs sfx, 2026-09-26)

AUDIO: generated catch, jar_fill, celebrate, tap_miss, ambience with a warmer/softer style block. Mistakes: tap_miss v1 was 0.4s (API minimum 0.5s) -> added v2; Music API needs a paid plan -> ambience v2 uses the sfx endpoint (20s) and the game loops it at volume 0.25. Picks are unaudited defaults, to be swapped by ear. ~10 min.

BUILD 7: Wired the art agent's 12 baked side flap frames (70ms/frame, flipX by direction) and the green/pink front variants into Firefly. AI note: earlier code expected up/mid/down keys that were replaced by flap_00..11; fixed from docs/ASSETS.md. ~8 min.

AUDIO: picked catch v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked jar_fill v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked celebrate v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked tap_miss v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked ambience v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked catch_do v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked catch_re v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked catch_mi v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked catch_fa v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked catch_sol v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked catch_la v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked catch_si v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked catch_do2 v3_01 (elevenlabs synth, 2026-09-26)

AUDIO: picked jar_fill v3_01 (elevenlabs synth, 2026-09-26)

AUDIO v3 (user feedback: ElevenLabs sounds too piercing/high, melody ugly): the AI could not steer the API toward low, tuneful sounds, so wrote scripts/synth_sfx.py (soft low sine tones, pentatonic/major scale, lowpass, echo, no highs) as a 'synth' version v3 in the same candidates/pick pipeline. Each tap now plays the next note of a rising do-re-mi-fa-sol-la-si-do' melody (catch_<note> keys); jar_fill is a low soft swell; ambience is a seamless quiet pad. Also removed colour variants (yellow only) and enlarged the hovering front pose (idleWidth) to match the side view. ~25 min.

BUILD 8: Per user feedback, no respawn on catch: round starts with 10 fireflies, catching the last triggers the celebration, then 10 new ones fade in and the jar empties. Test now asserts 10 fireflies after reset. ~5 min.

BUILD 9: Catch notes are now random within the pentatonic scale (no repeats, max 2-step leaps) instead of a fixed do-re-mi run, so any order sounds tuneful. ~3 min.

BUILD 10: Celebration reworked per feedback: all 10 fireflies (mixed poses + green/pink variants) float out of the jar, with an animated palette-only rainbow (accent/glow/leaves/jar) that sweeps in, shimmers, fades. Firefly glow shrunk and offset onto the bulb only. AI note: test timed out at default 30s after the longer celebration; raised to 90s. ~15 min.
