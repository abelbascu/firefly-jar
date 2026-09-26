import { TUNING } from '../config.js';

// Soft radial gradient drawn in code; tint + ADD blend give the glow.
export function ensureGlowTexture(scene) {
  if (scene.textures.exists('glow_soft')) return 'glow_soft';
  const size = 256;
  const tex = scene.textures.createCanvas('glow_soft', size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return 'glow_soft';
}

export function makeGlow(scene, x, y, color, diameter = TUNING.glowSize) {
  return scene.add.image(x, y, ensureGlowTexture(scene))
    .setDisplaySize(diameter, diameter).setTint(color).setBlendMode(Phaser.BlendModes.ADD);
}
