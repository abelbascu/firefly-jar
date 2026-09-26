# Firefly Jar

A calm one-screen night-garden game for kids aged 4–7: tap fireflies to float them into a jar.

Live: https://abelbascu.github.io/firefly-jar/

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
