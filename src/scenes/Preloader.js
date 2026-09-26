import Phaser from 'phaser';

const base = import.meta.env.BASE_URL;

async function fetchJson(path) {
  try {
    const res = await fetch(base + path);
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

export default class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  async create() {
    const [sprites, audio] = await Promise.all([
      fetchJson('sprites/sprites.json'),
      fetchJson('audio/audio.json'),
    ]);
    const hiDpi = window.devicePixelRatio > 1;
    for (const [key, e] of Object.entries(sprites)) {
      this.load.image(key, `${base}sprites/${hiDpi && e.file2x ? e.file2x : e.file}`);
    }
    for (const [key, e] of Object.entries(audio)) {
      this.load.audio(key, `${base}audio/${e.file}`);
    }
    this.load.once('complete', () => this.scene.start('MainScene'));
    this.load.start();
  }
}
