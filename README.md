# Firefly Jar

A calm one-screen night-garden game for kids aged 4–7: tap fireflies to float them into a jar.

Live: https://abelbascu.github.io/firefly-jar/

## How to play
Tap a firefly and it floats into the jar (each tap plays a soft random pentatonic note). Tap empty night and
nearby fireflies drift toward you (the added mechanic, see DESIGN_NOTE.md). Catch all 10: the jar glows, the whole
flock flies out under a rainbow, then 10 fresh fireflies appear and the jar is empty again. No text, timers or fail states.

## Run
```
npm install
npm run dev
```

## Regenerate assets
```
python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
npm run art -- gen firefly
npm run sfx -- gen catch
```
Keys go in `.env` (see `.env.example`).

## Test
```
npx playwright test
```
Boots the game (iPad landscape, touch), taps a firefly, checks the jar count, and runs a full 10-catch round.
Screenshots land in `test-results/`.

## Structure
`src/config.js` (palette + all tuning) · `src/scenes/` (Preloader, MainScene) · `src/objects/` (Firefly, Jar, Background,
Celebration, glow). Sprites and audio load only through `public/sprites/sprites.json` and `public/audio/audio.json`.
