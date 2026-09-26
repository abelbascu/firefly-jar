import Phaser from 'phaser';
import { GAME, PALETTE, TUNING } from '../config.js';
import Firefly from '../objects/Firefly.js';
import Background from '../objects/Background.js';
import Jar from '../objects/Jar.js';
import { playFlock, playRainbow } from '../objects/Celebration.js';
import { ensureGlowTexture } from '../objects/glow.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.add.rectangle(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, PALETTE.night);
    new Background(this);
    this.jar = new Jar(this);
    // very quiet looping ambience; Phaser holds it until the first tap unlocks audio
    if (this.cache.audio.exists('ambience')) this.sound.play('ambience', { loop: true, volume: TUNING.ambienceVolume });
    this.fireflies = [];
    this.celebrating = false;
    this.noteIdx = -1;
    this.spawnAll(false);

    this.input.on('gameobjectdown', (_p, obj) => obj.fireflyRef && this.catchFirefly(obj.fireflyRef));
    // The one extra mechanic: tapping empty night "calls" nearby fireflies.
    this.input.on('pointerdown', (p, over) => { if (!over.length) this.callFireflies(p.x, p.y); });
  }

  spawnAll(fadeIn) {
    for (let i = 0; i < TUNING.fireflyCount; i++) this.spawnFirefly(fadeIn, TUNING.variants[i % TUNING.variants.length]);
  }

  spawnFirefly(fadeIn = false, variant = null) {
    const w = TUNING.wander;
    const f = new Firefly(this, Phaser.Math.Between(w.minX, w.maxX), Phaser.Math.Between(w.minY, w.maxY), { fadeIn, variant });
    this.fireflies.push(f);
    return f;
  }

  sfx(key, volume = 0.6) {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
  }

  // Random but tuneful: pentatonic notes, no repeats, small steps from the last note.
  nextNote() {
    const scale = TUNING.catchScale;
    const ok = scale.map((_, i) => i).filter((i) => i !== this.noteIdx
      && (this.noteIdx < 0 || Math.abs(i - this.noteIdx) <= TUNING.catchMaxLeap));
    this.noteIdx = Phaser.Utils.Array.GetRandom(ok);
    return scale[this.noteIdx];
  }

  catchFirefly(f) {
    if (f.caught || this.celebrating) return;
    f.caught = true;
    f.stop();
    f.zone.disableInteractive();
    const note = this.nextNote();
    this.sfx(this.cache.audio.exists(`catch_${note}`) ? `catch_${note}` : 'catch', 0.5);
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
        this.sfx('jar_fill', TUNING.jarFillVolume);
        if (jar.count >= TUNING.jarTarget) this.celebrate();
      },
    });
  }

  callFireflies(x, y) {
    this.sfx('tap_miss', 0.25);
    const ring = this.add.circle(x, y, 20).setStrokeStyle(5, PALETTE.accent, 0.8).setDepth(3);
    this.tweens.add({ targets: ring, scale: TUNING.callRadius / 20, alpha: 0, duration: 1600, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
    for (const f of this.fireflies) {
      if (!f.caught && Phaser.Math.Distance.Between(f.x, f.y, x, y) < TUNING.callRadius) f.callTo(x, y);
    }
  }

  celebrate() {
    this.celebrating = true;
    this.sfx('celebrate', 0.8);
    this.jar.swell();

    // soft sparkles, drawn in code: warm additive orbs drifting up and fading
    const burst = this.add.particles(TUNING.jarX, TUNING.jarY - 40, ensureGlowTexture(this), {
      emitting: false, lifespan: { min: 1800, max: 2800 },
      speed: { min: 30, max: 120 }, angle: { min: 200, max: 340 }, gravityY: -12,
      scale: { start: 0.22, end: 0 }, alpha: { start: 0.9, end: 0, ease: 'Sine.easeIn' },
      tint: [PALETTE.glow, PALETTE.accent, PALETTE.jar], blendMode: 'ADD',
    }).setDepth(12);
    [0, 700, 1400].forEach((d) => this.time.delayedCall(d, () => burst.explode(14)));

    // the whole flock floats out of the jar, under an animated rainbow
    playFlock(this, this.jar);
    const fadeRainbow = playRainbow(this);

    // calm reset: fade, never cut
    this.time.delayedCall(TUNING.celebrateMs, () => {
      fadeRainbow();
      this.jar.reset(TUNING.resetFadeMs, () => {
        this.celebrating = false;
        this.noteIdx = -1;
        this.spawnAll(true); // a fresh set of fireflies drifts in
        burst.destroy();
      });
    });
  }

  update(_t, delta) {
    for (const f of this.fireflies) f.update(delta);
  }
}
