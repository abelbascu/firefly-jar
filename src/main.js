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
// Phones report stale sizes right after a rotation, so wait until the size is stable, and re-check after
// every (re)load: a page that booted with stale sizes fixes itself instead of staying in a tiny frame.
const orientationOk = () => (window.innerHeight > window.innerWidth) === PORTRAIT;
let settleTimer;
function settle() {
  clearTimeout(settleTimer);
  let last = '';
  const poll = (tries) => {
    const now = `${window.innerWidth}x${window.innerHeight}`;
    if (now !== last && tries < 12) { last = now; settleTimer = setTimeout(() => poll(tries + 1), 200); return; }
    if (orientationOk()) { game.scale.refresh(); return; }
    let n = 0;
    try { n = Number(sessionStorage.getItem('fj_reloads') || 0); sessionStorage.setItem('fj_reloads', String(n + 1)); } catch { /* ignore */ }
    if (n < 6) window.location.reload();
  };
  poll(0);
}
window.addEventListener('resize', settle);
window.addEventListener('orientationchange', settle);
window.addEventListener('load', () => { try { sessionStorage.setItem('fj_reloads', '0'); } catch { /* ignore */ } settle(); });
