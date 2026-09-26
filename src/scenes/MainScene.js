import Phaser from 'phaser';
import { GAME, PALETTE, TUNING } from '../config.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.add.rectangle(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, PALETTE.night);
    // Sprites are scaled to a display size so @1x/@2x textures look identical.
    if (this.textures.exists('jar')) {
      this.add.image(GAME.width / 2, GAME.height - 130, 'jar').setDisplaySize(180, 180 * this.ratio('jar'));
    }
    if (this.textures.exists('firefly_yellow')) {
      const f = this.add.image(GAME.width / 2, GAME.height / 2, 'firefly_yellow');
      f.setDisplaySize(140, 140 * this.ratio('firefly_yellow'));
      this.tweens.add({
        targets: f, y: f.y - TUNING.bobPx, duration: TUNING.bobMs,
        ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });
    }
  }

  ratio(key) {
    const { width, height } = this.textures.get(key).getSourceImage();
    return height / width;
  }
}
