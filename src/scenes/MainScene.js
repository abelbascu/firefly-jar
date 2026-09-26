import Phaser from 'phaser';
import { GAME, PALETTE, TUNING } from '../config.js';
import Firefly from '../objects/Firefly.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.add.rectangle(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, PALETTE.night);
    this.fireflies = [];
    for (let i = 0; i < TUNING.fireflyCount; i++) this.spawnFirefly();
  }

  spawnFirefly(fadeIn = false) {
    const w = TUNING.wander;
    const f = new Firefly(this, Phaser.Math.Between(w.minX, w.maxX), Phaser.Math.Between(w.minY, w.maxY), { fadeIn });
    this.fireflies.push(f);
    return f;
  }

  update(_t, delta) {
    for (const f of this.fireflies) f.update(delta);
  }
}
