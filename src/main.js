import Phaser from 'phaser';
import { GAME, PALETTE } from './config.js';
import Preloader from './scenes/Preloader.js';
import MainScene from './scenes/MainScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME.width,
  height: GAME.height,
  backgroundColor: PALETTE.night,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Preloader, MainScene],
});
