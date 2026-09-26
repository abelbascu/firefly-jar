import Phaser from 'phaser';
import { GAME, PALETTE, TUNING } from '../config.js';
import Firefly from '../objects/Firefly.js';
import Jar from '../objects/Jar.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.add.rectangle(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, PALETTE.night);
    this.jar = new Jar(this);
    this.fireflies = [];
    this.celebrating = false;
    for (let i = 0; i < TUNING.fireflyCount; i++) this.spawnFirefly();

    this.input.on('gameobjectdown', (_p, obj) => obj.fireflyRef && this.catchFirefly(obj.fireflyRef));
  }

  spawnFirefly(fadeIn = false) {
    const w = TUNING.wander;
    const f = new Firefly(this, Phaser.Math.Between(w.minX, w.maxX), Phaser.Math.Between(w.minY, w.maxY), { fadeIn });
    this.fireflies.push(f);
    return f;
  }

  sfx(key, volume = 0.6) {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
  }

  catchFirefly(f) {
    if (f.caught || this.celebrating) return;
    f.caught = true;
    f.stop();
    f.zone.disableInteractive();
    this.sfx('catch');
    const jar = this.jar;
    const slot = jar.slot(jar.count);
    // curved path: quadratic bezier, control point above-between
    const a = new Phaser.Math.Vector2(f.x, f.y);
    const c = new Phaser.Math.Vector2((f.x + slot.x) / 2 + (f.x < slot.x ? -90 : 90), Math.min(f.y, slot.y) - 120);
    const b = new Phaser.Math.Vector2(slot.x, slot.y - 30);
    const curve = new Phaser.Curves.QuadraticBezier(a, c, b);
    const p = new Phaser.Math.Vector2();
    const startScale = f.box.scale;
    this.tweens.addCounter({
      from: 0, to: 1, duration: TUNING.catchMs, ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const t = tw.getValue();
        curve.getPoint(t, p);
        f.box.setPosition(p.x, p.y).setScale(Phaser.Math.Linear(startScale, TUNING.catchScale, t));
        f.box.setAlpha(1 - Math.max(0, t - 0.7) / 0.3);
      },
      onComplete: () => {
        this.fireflies.splice(this.fireflies.indexOf(f), 1);
        f.destroy();
        jar.add();
        this.sfx('jar_fill');
        this.spawnFirefly(true); // nothing is ever lost: a new one drifts in
        if (jar.count >= TUNING.jarTarget) this.celebrate();
      },
    });
  }

  celebrate() {
    this.celebrating = true;
  }

  update(_t, delta) {
    for (const f of this.fireflies) f.update(delta);
  }
}
