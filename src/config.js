export const PALETTE = {
  night: 0x2b3a67,
  glow: 0xffd166,
  leaves: 0x7bc47f,
  accent: 0xf4a6b7,
  jar: 0xfff4e0,
};

// Stage size is chosen once at boot from the screen's own aspect ratio, so FIT fills the whole screen without
// stretching: the short side is 768 game px, the long side grows (1024..1800) to match the device.
// The visual viewport is the area actually visible (excludes mobile browser toolbars); innerHeight can be taller.
export const viewSize = () => {
  if (typeof window === 'undefined') return { w: 1024, h: 768 };
  const v = window.visualViewport;
  return { w: Math.round(v?.width || window.innerWidth), h: Math.round(v?.height || window.innerHeight) };
};
const { w: vw, h: vh } = viewSize();
export const PORTRAIT = vh > vw;
const clampLong = (v) => Math.min(1800, Math.max(1024, Math.round(v)));
export const GAME = PORTRAIT
  ? { width: 768, height: clampLong((768 * vh) / vw) }
  : { width: clampLong((768 * vw) / vh), height: 768 };

export const TUNING = {
  // fireflies
  fireflyCount: 10, // = jarTarget: catch them all, then celebrate
  fireflyWidth: 110, // display width px (height follows the sprite's aspect)
  hitRadius: 56, // invisible tap circle in game px (112 diameter); Firefly grows it so it is >= minHitCssPx on screen
  minHitCssPx: 100, // on-screen diameter floor (spec: >= 96px) even when the stage is scaled down on a phone
  wander: { minX: 70, maxX: GAME.width - 70, minY: 80, maxY: GAME.height - 248 },
  moveMs: [2600, 5200], // duration of one eased leg
  hoverMs: [500, 1600], // pause between legs (front-idle pose)
  flapFrameMs: 70, // 12 baked side frames, looped
  variants: [null], // yellow only
  glowBase: 0.55,
  glowPulseMs: 1800,
  glowSize: 110, // additive glow diameter: only the lightbulb glows
  bulbOffset: 0.27, // bulb centre below sprite centre, as a fraction of display height
  callRadius: 320, // how far a tap "calls" fireflies (mechanic)
  callDriftMs: 2600,
  // jar
  jarX: GAME.width / 2,
  jarY: GAME.height - 143,
  jarWidth: 210,
  jarTarget: 10,
  jarGlowMin: 0.12,
  jarGlowMax: 1,
  // catch
  catchMs: 1500,
  catchScale: 0.45,
  respawnFadeMs: 1400,
  // celebration
  celebrateMs: 6200, // flock leaves over ~5s
  resetFadeMs: 1600,
  // ambience
  starCount: Math.round((46 * GAME.width * GAME.height) / (1024 * 768)),
  ambienceVolume: 0.18,
  // each catch plays a random note of the pentatonic scale (never clashes), moving by small steps
  noteScale: ['do', 're', 'mi', 'sol', 'la', 'do2'],
  catchMaxLeap: 2,
  idleWidth: 150, // front pose is drawn larger so it matches the side view's size
  jarFillVolume: 0.4,
};
