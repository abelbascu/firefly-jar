"""Audio pipeline: gen | pick | list. Prompts live ONLY in audio/prompts.yaml."""
import argparse
import datetime
import json
import shutil
import subprocess
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
PROMPTS = ROOT / "audio" / "prompts.yaml"
CAND = ROOT / "assets" / "_candidates" / "sfx"
ARCHIVE = ROOT / "assets" / "_archive" / "audio"
OUT = ROOT / "public" / "audio"
MANIFEST = OUT / "audio.json"
LOG = ROOT / "PROCESS_LOG.md"


def load_prompts():
    return yaml.safe_load(PROMPTS.read_text(encoding="utf-8"))


def sound_cfg(key, version=None):
    sounds = load_prompts()["sounds"]
    cfg = sounds.get(key)
    if not cfg:
        sys.exit(f"Unknown sound '{key}'. Known: {', '.join(sounds)}")
    version = version or sorted(cfg)[-1]
    if version not in cfg:
        sys.exit(f"Sound '{key}' has no version '{version}'. Have: {', '.join(cfg)}")
    return version, cfg[version]


def cmd_gen(a):
    load_dotenv(ROOT / ".env")
    from elevenlabs.client import ElevenLabs

    version, cfg = sound_cfg(a.key, a.version)
    text = f"{' '.join(load_prompts()['style'].split())} {cfg['prompt']}"
    client = ElevenLabs()
    out = CAND / a.key
    out.mkdir(parents=True, exist_ok=True)
    start = len(list(out.glob(f"{version}_*.mp3")))
    for i in range(a.n):
        path = out / f"{version}_{start + i + 1:02d}.mp3"
        if cfg["type"] == "music":
            audio = client.music.compose(prompt=text, music_length_ms=int(cfg["seconds"] * 1000))
        else:
            audio = client.text_to_sound_effects.convert(
                text=text, duration_seconds=cfg["seconds"], prompt_influence=0.5)
        data = b"".join(audio)  # consume fully before touching disk
        path.write_bytes(data)
        print("saved", path.relative_to(ROOT))


def ffmpeg_process(src, dst, lufs, is_music, norm=True):
    if not shutil.which("ffmpeg"):
        print("ffmpeg not found; copying unprocessed")
        shutil.copy(src, dst)
        return
    if not norm:  # synthesised sounds are already level-controlled
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-c:a", "libmp3lame", "-q:a", "3", str(dst)], check=True)
        return
    dur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)]).strip())
    filters = ["silenceremove=start_periods=1:start_threshold=-50dB", f"loudnorm=I={lufs}:TP=-2:LRA=11"]
    if not is_music:
        filters.append(f"afade=t=out:st={max(dur - 0.05, 0):.3f}:d=0.05")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", ",".join(filters),
                    "-c:a", "libmp3lame", "-q:a", "3", str(dst)], check=True)


def cmd_pick(a):
    version, cfg = sound_cfg(a.key, a.version)
    tag = f"{version}_{int(a.nn):02d}"
    src = CAND / a.key / f"{tag}.mp3"
    if not src.exists():
        sys.exit(f"Not found: {src}")
    is_music = cfg["type"] == "music"
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{a.key}.mp3"
    if dest.exists():
        ARCHIVE.mkdir(parents=True, exist_ok=True)
        shutil.move(str(dest), ARCHIVE / f"{a.key}_{datetime.datetime.now():%Y%m%d-%H%M%S}.mp3")
    ffmpeg_process(src, dest, -24 if is_music else -18, is_music, cfg.get("norm", True))
    m = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    m[a.key] = {"file": dest.name, "version": tag, "source": "synth" if cfg["type"] == "synth" else f"elevenlabs-{cfg['type']}",
                "date": datetime.date.today().isoformat(), "loop": is_music or a.key == "ambience"}
    MANIFEST.write_text(json.dumps(m, indent=2), encoding="utf-8")
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"\nAUDIO: picked {a.key} {tag} (elevenlabs {cfg['type']}, {datetime.date.today()})\n")
    print(f"picked -> public/audio/{a.key}.mp3")


def cmd_list(_):
    m = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    for k, v in m.items():
        print(f"{k:14} {v['file']:18} {v['version']:8} {v['source']}  {v['date']}")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("gen")
    g.add_argument("key")
    g.add_argument("--version")
    g.add_argument("--n", type=int, default=4)
    g.set_defaults(f=cmd_gen)
    k = sub.add_parser("pick")
    k.add_argument("key")
    k.add_argument("nn")
    k.add_argument("--version")
    k.set_defaults(f=cmd_pick)
    sub.add_parser("list").set_defaults(f=cmd_list)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
