import Phaser from 'phaser';
import { PALETTE, TUNING } from '../config.js';
import { makeGlow } from './glow.js';

export default class Jar {
  constructor(scene) {
    this.scene = scene;
    this.count = 0;
    const { jarX: x, jarY: y, jarWidth: w } = TUNING;

    this.halo = makeGlow(scene, x, y, PALETTE.glow, w * 2.2).setAlpha(0).setDepth(4);
    this.inner = makeGlow(scene, x, y + 12, PALETTE.glow, w * 1.1).setAlpha(TUNING.jarGlowMin).setDepth(6);
    if (scene.textures.exists('jar')) {
      const { width, height } = scene.textures.get('jar').getSourceImage();
      this.sprite = scene.add.image(x, y, 'jar').setDisplaySize(w, w * (height / width)).setDepth(5);
      this.height = w * (height / width);
    } else {
      // drawn stand-in: rounded translucent jar
      const g = scene.add.graphics().setDepth(5);
      g.fillStyle(PALETTE.jar, 0.25).fillRoundedRect(x - w / 2, y - w / 2, w, w, 40);
      g.lineStyle(6, PALETTE.jar, 0.8).strokeRoundedRect(x - w / 2, y - w / 2, w, w, 40);
      this.sprite = g;
      this.height = w;
    }
    this.dots = [];
    this.applyLevel(0);
  }

  get x() { return TUNING.jarX; }
  get y() { return TUNING.jarY; }
  // where a caught firefly settles inside the glass
  slot(i) {
    const w = TUNING.jarWidth;
    const col = i % 3, row = Math.floor(i / 3);
    return { x: this.x + (col - 1) * w * 0.2 + ((row % 2) * w * 0.05), y: this.y + this.height * 0.22 - row * this.height * 0.12 };
  }

  applyLevel(n) {
    const t = Phaser.Math.Clamp(n / TUNING.jarTarget, 0, 1);
    this.level = t;
    return Phaser.Math.Linear(TUNING.jarGlowMin, TUNING.jarGlowMax, t);
  }

  // Add one caught firefly: a small glowing orb rests in the jar; glow brightens.
  add() {
    const s = this.scene;
    const p = this.slot(this.count);
    const dot = makeGlow(s, p.x, p.y, PALETTE.glow, 46).setDepth(7).setAlpha(0);
    s.tweens.add({ targets: dot, alpha: 0.95, duration: 900, ease: 'Sine.easeOut' });
    s.tweens.add({ targets: dot, y: p.y - 6, duration: 1600 + this.count * 90, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    this.dots.push(dot);
    this.count++;
    const a = this.applyLevel(this.count);
    s.tweens.add({ targets: this.inner, alpha: a, duration: 1000, ease: 'Sine.easeInOut' });
    s.tweens.add({ targets: this.halo, alpha: this.level * 0.5, duration: 1000, ease: 'Sine.easeInOut' });
  }

  // Big warm swell for the celebration.
  swell() {
    this.scene.tweens.add({ targets: this.halo, alpha: 1, scale: this.halo.scale * 1.25, duration: 900, ease: 'Sine.easeInOut', yoyo: true, hold: 900 });
    this.scene.tweens.add({ targets: this.inner, alpha: 1, duration: 900, ease: 'Sine.easeInOut', yoyo: true, hold: 900 });
  }

  // Calm reset: everything fades out, then the jar is empty again.
  reset(ms, done) {
    const s = this.scene;
    s.tweens.add({ targets: [...this.dots, this.halo], alpha: 0, duration: ms, ease: 'Sine.easeInOut' });
    s.tweens.add({
      targets: this.inner, alpha: TUNING.jarGlowMin, duration: ms, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.dots.forEach((d) => { s.tweens.killTweensOf(d); d.destroy(); });
        this.dots = [];
        this.count = 0;
        this.applyLevel(0);
        done?.();
      },
    });
  }
}
