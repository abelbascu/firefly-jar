# Firefly Jar — Delivery

> Fill every **[YOUR THOUGHTS]** gap before sending. Everything else is drawn from the repo, git history and logs.

## 1. Playable build
- **Play (hosted, GitHub Pages):** https://abelbascu.github.io/firefly-jar/
- Works with touch (tablet and Android phone, portrait or landscape, filling the whole screen) and mouse. Audio starts after the first tap.
- **How it plays:** tap a firefly and it floats into the jar (each tap plays a soft random pentatonic note). Tap empty night and nearby fireflies drift toward you (the added mechanic). Catch all 10 and the jar glows, the whole flock flies out under a rainbow, then 10 new fireflies appear and the jar is empty again. No text, no timers, no fail states.
- **[YOUR THOUGHTS: how it felt on your phone/tablet; anything you would flag before a reviewer opens it]**

## 2. Source code
- **Repo:** https://github.com/abelbascu/firefly-jar (public; `main` deploys automatically)
- Run locally: `npm install && npm run dev`. Tests: `npx playwright test` (6 tests: boot, tap to jar, full 10-catch round, Android-portrait touch, both rotation directions).
- Layout: `src/config.js` (palette and every tuning number), `src/scenes/`, `src/objects/` (Firefly, Jar, Background, Celebration, glow). Sprites and audio load only via `public/sprites/sprites.json` and `public/audio/audio.json`, so an asset can be swapped with no code change.
- Stack: Phaser 3 (^3.90) + Vite, plain JS.

## 3. Process log
Full raw files: [PROCESS_LOG.md](PROCESS_LOG.md), [CHANGELOG.md](CHANGELOG.md), [PROMPTS_VERBATIM.md](PROMPTS_VERBATIM.md) (every prompt, auto-captured by a hook), [docs/PLANNING_SESSION_LOG.md](docs/PLANNING_SESSION_LOG.md) (the planning chat before coding).

### 3.1 Key prompts, verbatim
Art prompts live only in `art/prompts.yaml` and audio prompts in `audio/prompts.yaml` (the scripts read nothing else; versions are never overwritten, so the history is the log).

**Planning (Claude desktop app, 10:38)**
```
i have 4 hours to work on this job candidate assignment. I want to know what are the best tools i need to use to 100% automate dev process without hand doing anything. I use VS code normally, but if i need to use graphic models to generate the best possible images for kids, tell me how to integrate all the models and technologies. what are your recommendations?
```
**Handing over to Claude Code (VS Code)**
```
check @HANDOFF.md and what copilot did. verify it´s all ok and continue from there
```
**Game build brief (code).** A long brief given to a Claude Code session: goal, hard rules from the spec, asset contract with guarded fallbacks, and a six-step build order (Firefly, Jar, catch, celebration, one original mechanic, polish and tests). Full text is in the hook log in [PROMPTS_VERBATIM.md](PROMPTS_VERBATIM.md).

**Feedback prompts that changed the game (verbatim, typos kept)**
```
remember the game is for kids shold be very asrm sounds gently soft
```
```
the sound is too piercing to the ears, very acute, bot the melody, which is ugly and no melodic sense and when tap to pick up the fireflies
```
```
a cool thing would be that each time a firefly is tapped, it generated a different note on the scale of do, but it should be melodic sequence
```
```
it's cool, but make that when tapping doesn't go to do re mi fa sol, la si do, but random notes that sound melodic
```
```
do not spawn a new firefly when one is catch , the player must catch the last one, then there is a celebration, then the 10 fireflies appear again and the jhar is empty again
```
```
on the celebration, only a firefly moves up... but all 10 should leave, now here we can use all the firefly color poses that we have , and maybe paint an animatied rainbow for the celeb  too
```
```
the glow arond the fireflies should be restricted to the bottom lightbulb
```
```
we have lost the anim when tap a firelfy how it goes to the jar, now it just idsappears
```
```
Works with touch on a tablet and with a mouse on desktop. WE NEED THIS FIRST IT'S IMPORTANT! I WILL TEST ON MY ANDROID PHONE ONCE YOU HAVE IT
```
**[YOUR THOUGHTS: which 2-3 prompts mattered most, and why. Also the art prompts and picks you are proudest of.]**

### 3.2 Tools used, and why
| Tool | Used for | Why |
|---|---|---|
| Claude (desktop app) | Planning: tool choice, setup document | Fast comparison of options before writing code |
| Claude Code in VS Code | Code, scripts, tests, commits, deploy | Runs commands, sees screenshots and test output, one loop, no tool-switching |
| Gemini image model (`scripts/art.py`) | Firefly, poses, flap frames | Reference-image consistency; chroma-key cutout so no manual editing in Krita or Photoshop |
| ElevenLabs (`scripts/sfx.py`) | First audio pass | API plus a candidates/pick workflow inside the repo |
| Python + numpy (`scripts/synth_sfx.py`) | Final catch, jar, celebrate sounds | ElevenLabs output was too shrill and unmelodic; synthesis gives full control (soft, low, pentatonic) |
| Phaser 3 + Vite, Playwright, GitHub Actions/Pages | Game, tests, hosting | Spec-friendly, touch-first, one-push deploy |
| **[YOUR THOUGHTS]** | Music: *Firefly Meadow* (looping ambience) | **[where this track came from, and why you chose it]** |

### 3.3 Where the AI got it wrong, and how it was corrected
Taken from the logs; each was caught by a test, a screenshot, or by you listening and playing.
1. **Phaser v4 installed** instead of v3. Caught against the spec, pinned to `^3.90`.
2. **`requirements.txt` written as UTF-16** by a PowerShell redirect. Regenerated as UTF-8.
3. **API key committed to the public repo** (pasted into `.env.example`); Google auto-disabled it. Keys now only in `.env`; the old key is still visible in history (commit `47868e1`, dead). **[YOUR THOUGHTS: what you did or would do about history]**
4. **Empty mp3 files** from failed audio API calls. The script now writes only after a successful response.
5. **Image models:** the free tier quota was 0 (billing needed); glowing abdomens picked up a magenta fringe from the chroma-key background, and glow should be code anyway. Prompts changed to a semi-transparent bulb, glow drawn in code.
6. **Audio:** the 0.4 s sound was below the API minimum (0.5 s); the Music API needs a paid plan; and the generated sounds were high-pitched, piercing, with an ugly melody. Replaced by synthesised low, soft, pentatonic sounds; each tap plays a random tuneful note.
7. **Portrait "sanity" was not real:** the first pass only letterboxed the landscape stage, so on a phone the tap circles were about 40 px, breaking the 96 px rule. Fixed with a portrait stage and circles that scale to at least 100 CSS px, plus an Android-portrait test. Your real-phone test then found two more problems the emulator missed: the stage did not fill a tall phone screen, and rotating back from landscape to portrait left a tiny frame (phones report stale window sizes right after rotating). Fixed by sizing the stage to the screen's shape and re-checking the orientation after each load.
8. **A regression I introduced:** reusing the config key `catchScale` for the note list turned the shrink factor into NaN, so caught fireflies just vanished. You spotted it while playing; the cause was found by probing tween state and a regression check was added.
9. **Design misses:** the first celebration sent up only one firefly; the glow covered the whole body instead of the bulb; the flock respawned on every catch, which undercut "catch the last one". All fixed after your feedback.
10. **Test details:** the full-round test hit Playwright's 30 s default timeout; the first bush art (overlapping translucent discs) looked muddy, so it became opaque shapes with a night overlay.
11. **[YOUR THOUGHTS: places where you overrode the AI on taste, e.g. picking the clay/plush art style (v6_02), removing the green/pink fireflies from play, and so on]**

### 3.4 Rough time split
Session ran about 10:38 to 13:45 (deadline 14:38). Approximate, from git timestamps and the planning log:

| Block | approx. time |
|---|---|
| Planning chat + setup document | ~45 min |
| Repo setup, pipelines, deploy, hooks (first commit 11:25) | ~1 h |
| Art exploration (styles v1-v8, poses, flap frames), in parallel with the build | ~1.5-2 h |
| Game build: fireflies, jar, catch, celebration, mechanic, background (12:51-12:58) | ~30 min of AI-run steps plus review |
| Audio iterations (ElevenLabs, then synthesis, notes, ambience) | ~45 min |
| Fixes and polish from your play-testing, phone support | ~45 min |

**[YOUR THOUGHTS: your own hands-on time vs. waiting-for-AI time, and what you would do differently]**

## 4. Design note (half a page at most)
**Added mechanic: "Call the fireflies".** Tapping empty night sends a soft ripple and nearby fireflies drift slowly toward that spot. It is wordless, cannot fail, and turns the most common 4-year-old behaviour (tapping where nothing is) into something pleasant that also helps. Each caught firefly also plays a random note of a pentatonic scale, so the child plays a little tune without trying. **[YOUR THOUGHTS: why this mechanic, in your words]**

**What I would build next.** Tap the jar to swirl the caught fireflies once; the sleepy pose and a night-to-dawn sky between rounds; more garden reactions (flowers that open); a parent-only volume control; real-device testing across iPad and small Androids; a seamless loop point for the music. **[YOUR THOUGHTS]**

**Deliberately cut.** Any score, counter or text (the jar is the only progress display); timers, fail states and lost fireflies; drag-to-jar (too fiddly for small hands, one tap is enough); colours outside the four-colour garden palette (the rainbow uses only palette colours); ElevenLabs music (paid plan). **[YOUR THOUGHTS]**

## 5. Screen recording (optional, 3-5 min)
**[YOUR LINK]**. Suggested walkthrough: (1) play a full round on the phone, (2) show `art/prompts.yaml`, the contact sheet, the pick and the sprite, (3) show `PROCESS_LOG.md` and one "AI got it wrong" moment (the vanishing firefly), (4) show the tests passing.

## Checklist before sending
- [ ] Every **[YOUR THOUGHTS]** filled
- [ ] Hosted link opens on a clean device
- [ ] Repo link is public and `PROMPTS_VERBATIM.md` is up to date
- [ ] Recording link (optional) added
