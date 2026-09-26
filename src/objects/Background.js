import Phaser from 'phaser';
import { GAME, PALETTE, TUNING } from '../config.js';
import { makeGlow } from './glow.js';

// Uses the 'background' sprite when present, otherwise draws a soft night garden in code.
export default class Background {
  constructor(scene) {
    const { width: W, height: H } = GAME;
    if (scene.textures.exists('background')) {
      const src = scene.textures.get('background').getSourceImage();
      const k = Math.max(W / src.width, H / src.height);
      scene.add.image(W / 2, H / 2, 'background').setDisplaySize(src.width * k, src.height * k).setDepth(0);
      return;
    }
    // moon: soft and far away
    makeGlow(scene, 830, 130, PALETTE.jar, 260).setAlpha(0.35).setDepth(1);
    scene.add.circle(830, 130, 44, PALETTE.jar, 0.9).setDepth(1);

    // stars: gentle, slow twinkle (never flashing)
    for (let i = 0; i < TUNING.starCount; i++) {
      const s = scene.add.circle(Phaser.Math.Between(10, W - 10), Phaser.Math.Between(10, 380), Phaser.Math.Between(2, 4), PALETTE.jar, 0.5).setDepth(1);
      scene.tweens.add({ targets: s, alpha: 0.15, duration: Phaser.Math.Between(2500, 4500), ease: 'Sine.easeInOut', yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 3000) });
    }

    // rolling bushes: opaque leaf shapes, dimmed into the night with a flat overlay
    const layers = [[0.72, 620, 60], [0.5, 690, 80]];
    layers.forEach(([dim, top, r], li) => {
      const g = scene.add.graphics().setDepth(2);
      g.fillStyle(PALETTE.leaves, 1);
      for (let x = -40 + li * 70; x < W + 80; x += r * 1.5) g.fillCircle(x, top + 60 + Math.sin(x * 0.02) * 12, r);
      g.fillRect(0, top + 60 + r, W, H);
      g.fillStyle(PALETTE.night, dim);
      for (let x = -40 + li * 70; x < W + 80; x += r * 1.5) g.fillCircle(x, top + 60 + Math.sin(x * 0.02) * 12, r);
      g.fillRect(0, top + 60 + r, W, H);
    });
    const g = scene.add.graphics().setDepth(2);
    // a few blossoms in the accent colour
    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 150 + Phaser.Math.Between(-30, 30), y = Phaser.Math.Between(670, 740);
      g.fillStyle(PALETTE.accent, 0.55).fillCircle(x, y, 9);
    }
  }
}
