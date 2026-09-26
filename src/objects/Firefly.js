import Phaser from 'phaser';
import { PALETTE, TUNING } from '../config.js';
import { makeGlow } from './glow.js';

const rnd = (a, b) => Phaser.Math.Between(a, b);

export default class Firefly {
  constructor(scene, x, y, { fadeIn = false, variant = null } = {}) {
    this.scene = scene;
    this.variant = variant && scene.textures.exists(variant) ? variant : null;
    this.caught = false;
    this.dir = 1;
    this.frame = 0;
    this.frameClock = 0;
    this.moving = false;

    this.glow = makeGlow(scene, 0, 0, PALETTE.glow);
    this.body = scene.add.image(0, 0, this.has('firefly') ? 'firefly' : '__DEFAULT');
    this.box = scene.add.container(x, y, [this.glow, this.body]).setDepth(10);
    if (!this.has('firefly')) this.makeFallback();
    this.setTex(this.idleKey());

    // Invisible tap circle, bigger than the sprite. Follows the container.
    const r = TUNING.hitRadius;
    this.zone = scene.add.zone(x, y, r * 2, r * 2).setDepth(11)
      .setInteractive({ hitArea: new Phaser.Geom.Circle(r, r, r), hitAreaCallback: Phaser.Geom.Circle.Contains, useHandCursor: true });
    this.zone.fireflyRef = this;

    scene.tweens.add({
      targets: this.glow, alpha: { from: TUNING.glowBase * 0.6, to: TUNING.glowBase },
      scale: { from: this.glow.scale * 0.9, to: this.glow.scale * 1.05 },
      duration: TUNING.glowPulseMs + rnd(0, 600), ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      delay: rnd(0, 1200),
    });

    if (fadeIn) {
      this.box.setAlpha(0);
      scene.tweens.add({ targets: this.box, alpha: 1, duration: TUNING.respawnFadeMs, ease: 'Sine.easeOut' });
    }
    this.nextLeg(rnd(0, 600));
  }

  has(key) { return this.scene.textures.exists(key); }

  makeFallback() {
    // Drawn stand-in if no sprite has been loaded.
    const g = this.scene.add.graphics();
    g.fillStyle(PALETTE.glow, 1).fillCircle(32, 32, 18);
    g.fillStyle(PALETTE.jar, 0.6).fillEllipse(20, 20, 22, 14).fillEllipse(44, 20, 22, 14);
    if (!this.scene.textures.exists('firefly_fallback')) g.generateTexture('firefly_fallback', 64, 64);
    g.destroy();
    this.body.setTexture('firefly_fallback');
  }

  get x() { return this.box.x; }
  get y() { return this.box.y; }

  idleKey() {
    if (this.variant) return this.variant;
    for (const k of ['firefly_pose_idle', 'firefly']) if (this.has(k)) return k;
    return 'firefly_fallback';
  }

  flapKeys() {
    if (this.variant) return null; // colour variants only have a front sprite
    if (!this.flap) {
      const k = Array.from({ length: 12 }, (_, i) => `firefly_side_flap_${String(i).padStart(2, '0')}`);
      this.flap = k.every((s) => this.has(s)) ? k : [];
    }
    return this.flap.length ? this.flap : null;
  }

  setTex(key) {
    if (this.body.texture.key !== key) this.body.setTexture(key);
    const { width, height } = this.body.texture.getSourceImage();
    this.body.setDisplaySize(TUNING.fireflyWidth, TUNING.fireflyWidth * (height / width));
  }

  // Called each frame by the scene.
  update(delta) {
    if (this.caught) return;
    this.zone.setPosition(this.box.x, this.box.y);
    const keys = this.moving && this.flapKeys();
    if (keys) {
      this.frameClock += delta;
      if (this.frameClock >= TUNING.flapFrameMs) {
        this.frameClock = 0;
        this.frame = (this.frame + 1) % keys.length;
      }
      this.setTex(keys[this.frame]);
      this.body.setFlipX(this.dir < 0);
    } else {
      this.setTex(this.idleKey());
      this.body.setFlipX(false);
    }
  }

  // One eased leg to a new waypoint (optionally a chosen target), then hover.
  nextLeg(delay = 0, target = null, duration = null) {
    if (this.caught) return;
    const w = TUNING.wander;
    const tx = target ? Phaser.Math.Clamp(target.x, w.minX, w.maxX) : rnd(w.minX, w.maxX);
    const ty = target ? Phaser.Math.Clamp(target.y, w.minY, w.maxY) : rnd(w.minY, w.maxY);
    this.legTween = this.scene.tweens.add({
      targets: this.box, x: tx, y: ty, delay,
      duration: duration ?? rnd(...TUNING.moveMs), ease: 'Sine.easeInOut',
      onStart: () => { this.moving = true; this.dir = tx >= this.box.x ? 1 : -1; },
      onComplete: () => {
        this.moving = false;
        this.hoverTimer = this.scene.time.delayedCall(rnd(...TUNING.hoverMs), () => this.nextLeg());
      },
    });
  }

  // Mechanic hook: drift gently towards a point.
  callTo(px, py) {
    if (this.caught) return;
    this.legTween?.remove();
    this.hoverTimer?.remove();
    this.moving = true;
    this.dir = px >= this.box.x ? 1 : -1;
    const o = { x: rnd(-40, 40), y: rnd(-40, 40) };
    this.nextLeg(0, { x: px + o.x, y: py + o.y }, TUNING.callDriftMs);
  }

  stop() {
    this.legTween?.remove();
    this.hoverTimer?.remove();
    this.moving = false;
  }

  destroy() {
    this.stop();
    this.scene.tweens.killTweensOf([this.glow, this.box]);
    this.zone.destroy();
    this.box.destroy();
  }
}
