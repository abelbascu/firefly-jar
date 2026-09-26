import Phaser from 'phaser';
import { GAME, PALETTE, TUNING } from '../config.js';
import { makeGlow } from './glow.js';

// Soft rainbow in palette colours only; sweeps in slowly, shimmers gently, then fades.
export function playRainbow(scene) {
  const cx = GAME.width / 2, cy = 640, bands = [PALETTE.accent, PALETTE.glow, PALETTE.leaves, PALETTE.jar];
  const g = scene.add.graphics().setDepth(3).setAlpha(0.6);
  const draw = (t) => {
    g.clear();
    bands.forEach((c, i) => {
      g.lineStyle(26, c, 1);
      g.beginPath();
      g.arc(cx, cy, 400 - i * 26, Math.PI, Math.PI + Math.PI * t, false);
      g.strokePath();
    });
  };
  scene.tweens.addCounter({ from: 0, to: 1, duration: 2200, ease: 'Sine.easeInOut', onUpdate: (tw) => draw(tw.getValue()) });
  scene.tweens.add({ targets: g, alpha: 0.4, duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
  return () => scene.tweens.add({
    targets: g, alpha: 0, duration: TUNING.resetFadeMs, ease: 'Sine.easeInOut',
    onComplete: () => { scene.tweens.killTweensOf(g); g.destroy(); },
  });
}

// All ten fireflies (every pose/colour we have) float up out of the jar and spread across the sky.
export function playFlock(scene, jar) {
  const keys = ['firefly_pose_happy', 'firefly_alt_pink', 'firefly_alt_green', 'firefly', 'firefly_pose_wings_up',
    'firefly_pose_idle', 'firefly_pose_wings_down', 'firefly_alt_pink', 'firefly_pose_happy', 'firefly_alt_green']
    .filter((k) => scene.textures.exists(k));
  const n = TUNING.jarTarget;
  // the small orbs inside the jar dim as their fireflies leave
  scene.tweens.add({ targets: jar.dots, alpha: 0, duration: 900, delay: 300, ease: 'Sine.easeInOut' });
  for (let i = 0; i < n; i++) {
    const key = keys.length ? keys[i % keys.length] : null;
    const box = scene.add.container(TUNING.jarX + Phaser.Math.Between(-30, 30), TUNING.jarY - 30).setDepth(14).setAlpha(0).setScale(0.4);
    let glowY = 0;
    const glow = makeGlow(scene, 0, 0, PALETTE.glow, TUNING.glowSize).setAlpha(0.6);
    box.add(glow);
    if (key) {
      const { width, height } = scene.textures.get(key).getSourceImage();
      const w = TUNING.idleWidth;
      box.add(scene.add.image(0, 0, key).setDisplaySize(w, w * (height / width)));
      glowY = w * (height / width) * TUNING.bulbOffset;
      glow.y = glowY;
    }
    const tx = 90 + (i * (GAME.width - 180)) / (n - 1) + Phaser.Math.Between(-25, 25);
    const ty = Phaser.Math.Between(90, 380);
    const delay = 250 + i * 170;
    const dur = Phaser.Math.Between(2800, 3600);
    scene.tweens.add({ targets: box, x: tx, y: ty, delay, duration: dur, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: box, scale: 1, alpha: 1, delay, duration: 900, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: box, alpha: 0, delay: delay + dur - 500, duration: 1300, ease: 'Sine.easeIn', onComplete: () => box.destroy() });
    scene.tweens.add({ targets: box, angle: { from: -6, to: 6 }, delay, duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: 3 });
  }
}
