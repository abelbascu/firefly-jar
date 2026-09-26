import Phaser from 'phaser';
import { GAME, PALETTE, PORTRAIT } from './config.js';
import Preloader from './scenes/Preloader.js';
import MainScene from './scenes/MainScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME.width,
  height: GAME.height,
  backgroundColor: PALETTE.night,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Preloader, MainScene],
});

window.__game = game; // debug hook for tests only

// Rotating the device: rebuild the stage in the matching layout (no stretching). The round restarts.
let rotateTimer;
window.addEventListener('resize', () => {
  clearTimeout(rotateTimer);
  rotateTimer = setTimeout(() => {
    if ((window.innerHeight > window.innerWidth) !== PORTRAIT) window.location.reload();
  }, 350);
});
