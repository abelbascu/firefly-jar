export const PALETTE = {
  night: 0x2b3a67,
  glow: 0xffd166,
  leaves: 0x7bc47f,
  accent: 0xf4a6b7,
  jar: 0xfff4e0,
};

export const GAME = { width: 1024, height: 768 };

export const TUNING = {
  // fireflies
  fireflyCount: 7,
  fireflyWidth: 110, // display width px (height follows the sprite's aspect)
  hitRadius: 56, // invisible tap circle (112px diameter, larger than the sprite body)
  wander: { minX: 70, maxX: 954, minY: 80, maxY: 520 },
  moveMs: [2600, 5200], // duration of one eased leg
  hoverMs: [500, 1600], // pause between legs (front-idle pose)
  flapFrameMs: 120, // up, mid, down, mid
  glowBase: 0.55,
  glowPulseMs: 1800,
  glowSize: 260, // additive glow display diameter
  callRadius: 320, // how far a tap "calls" fireflies (mechanic)
  callDriftMs: 2600,
  // jar
  jarX: 512,
  jarY: 625,
  jarWidth: 210,
  jarTarget: 10,
  jarGlowMin: 0.12,
  jarGlowMax: 1,
  // catch
  catchMs: 1500,
  catchScale: 0.45,
  respawnFadeMs: 1400,
  // celebration
  celebrateMs: 3800,
  resetFadeMs: 1600,
  // ambience
  starCount: 46,
};
