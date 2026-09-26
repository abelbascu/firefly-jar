"""Art pipeline: gen | sheet | pick | import | list. Prompts live ONLY in art/prompts.yaml."""
import argparse
import datetime
import io
import json
import re
import shutil
import sys
import time
from pathlib import Path

import numpy as np
import yaml
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PROMPTS = ROOT / "art" / "prompts.yaml"
CAND = ROOT / "assets" / "_candidates"
ARCHIVE = ROOT / "assets" / "_archive"
SPRITES = ROOT / "public" / "sprites"
MANIFEST = SPRITES / "sprites.json"
LOG = ROOT / "PROCESS_LOG.md"
NAVY = (0x2B, 0x3A, 0x67)
CREAM = (0xFF, 0xF4, 0xE0)
PRO_MODEL = "gemini-3-pro-image"


def load_prompts():
    return yaml.safe_load(PROMPTS.read_text(encoding="utf-8"))


def asset_cfg(key, version=None):
    assets = load_prompts()["assets"]
    cfg = assets.get(key)
    if not cfg:
        sys.exit(f"Unknown asset '{key}'. Known: {', '.join(assets)}")
    version = version or sorted(cfg)[-1]
    if version not in cfg:
        sys.exit(f"Asset '{key}' has no version '{version}'. Have: {', '.join(cfg)}")
    return version, cfg[version]


def build_prompt(style, cfg):
    style = " ".join(style.split())
    if cfg.get("no_cutout"):
        # drop the sentences that request the flat magenta background
        sentences = re.split(r"(?<=\.)\s+", style)
        style = " ".join(s for s in sentences if not re.search(r"magenta|background|halo", s, re.I))
    extra = " ".join(cfg.get("style_extra", "").split())
    return f"{style} {extra} {' '.join(cfg['prompt'].split())}".replace("  ", " ")


# ---------------------------------------------------------------- generation
def gen_one(client, types, model, contents, aspect):
    delay = 4
    for attempt in range(6):
        try:
            resp = client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(aspect_ratio=aspect or "1:1"),
                ),
            )
            for part in resp.candidates[0].content.parts:
                if getattr(part, "inline_data", None):
                    return Image.open(io.BytesIO(part.inline_data.data)).convert("RGBA")
            raise RuntimeError("response contained no image")
        except Exception as e:  # noqa: BLE001
            msg = str(e)
            retry = any(c in msg for c in ("429", "500", "502", "503", "504", "RESOURCE_EXHAUSTED", "UNAVAILABLE"))
            if not retry or attempt == 5:
                raise
            print(f"  retry in {delay}s ({msg[:80]})")
            time.sleep(delay)
            delay *= 2


def cmd_gen(a):
    load_dotenv(ROOT / ".env")
    from google import genai
    from google.genai import types

    version, cfg = asset_cfg(a.key, a.version)
    model = PRO_MODEL if a.pro else cfg["model"]
    prompt = build_prompt(load_prompts()["style"], cfg)
    refs = [Image.open(ROOT / p) for p in cfg.get("refs", [])]
    client = genai.Client()
    out = CAND / a.key
    out.mkdir(parents=True, exist_ok=True)
    start = len(list(out.glob(f"{version}_*.png")))
    for i in range(a.n):
        n = start + i + 1
        print(f"[{a.key} {version}] generating {n} ({model})...")
        img = gen_one(client, types, model, [prompt] + refs, cfg.get("aspect"))
        path = out / f"{version}_{n:02d}.png"
        img.save(path)
        print("  saved", path.relative_to(ROOT))
    cmd_sheet(argparse.Namespace(key=a.key, method="auto"))


# ---------------------------------------------------------------- cutout
def smoothstep(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def has_transparency(img):
    alpha = np.asarray(img.convert("RGBA"))[..., 3]
    return (alpha < 250).mean() > 0.02


def chroma_cutout(img):
    """Return an RGBA image, or None if the border isn't a uniform colour."""
    from scipy import ndimage

    rgb = np.asarray(img.convert("RGB")).astype(float)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    if border.std(axis=0).max() > 30:
        return None
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(rgb - bg, axis=2)
    alpha = smoothstep(dist, 28, 90)
    # only background-like pixels connected to the border may become transparent
    labels, _ = ndimage.label(alpha < 0.99)
    edge_labels = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    bgmask = np.isin(labels, list(edge_labels))
    alpha = np.where(bgmask, alpha, 1.0)
    # ~2px feather on the edge only
    feathered = ndimage.gaussian_filter(alpha, 0.8)
    alpha = np.where(ndimage.binary_dilation(bgmask, iterations=2), feathered, alpha)
    # despill: remove bg colour tint from semi-transparent edge pixels
    a = np.clip(alpha, 1e-3, 1)[..., None]
    edge = ((alpha > 0) & (alpha < 1))[..., None]
    despilled = np.clip((rgb - (1 - a) * bg) / a, 0, 255)
    rgb = np.where(edge, despilled, rgb)
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")


def rembg_cutout(img):
    from rembg import new_session, remove

    return remove(img.convert("RGBA"), session=new_session("isnet-general-use")).convert("RGBA")


def cutout(img, method="auto"):
    if method != "rembg" and has_transparency(img):
        return img.convert("RGBA")
    if method in ("auto", "chroma"):
        res = chroma_cutout(img)
        if res is not None:
            return res
        if method == "chroma":
            sys.exit("Border not uniform; use --method rembg")
        print("  border not uniform -> rembg fallback")
    return rembg_cutout(img)


def trim_pad(img):
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox:
        img = img.crop(bbox)
    w, h = img.size
    pad = int(round(max(w, h) * 0.08))
    canvas = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    canvas.paste(img, (pad, pad))
    return canvas


def fit_longest(img, px):
    w, h = img.size
    s = px / max(w, h)
    return img.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


# ---------------------------------------------------------------- sheet
def cmd_sheet(a):
    d = CAND / a.key
    files = sorted(p for p in d.glob("*.png") if not p.name.startswith("_"))
    if not files:
        sys.exit(f"No candidates in {d}")
    _, cfg = asset_cfg(a.key, files[0].stem.split("_")[0])
    tile, cols = 384, 3
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tile, rows * tile), NAVY)
    try:
        font = ImageFont.truetype("arialbd.ttf", 56)
    except OSError:
        font = ImageFont.load_default()
    draw = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        img = Image.open(f).convert("RGBA")
        if not cfg.get("no_cutout"):
            img = cutout(img, getattr(a, "method", "auto"))
        img = fit_longest(img, tile - 40)
        x, y = (i % cols) * tile, (i // cols) * tile
        sheet.paste(img, (x + (tile - img.width) // 2, y + (tile - img.height) // 2), img)
        draw.rectangle([x + 6, y + 6, x + 190, y + 72], fill=CREAM)
        draw.text((x + 14, y + 6), f.stem.replace("_", "-"), fill=NAVY, font=font)
        draw.rectangle([x, y, x + tile - 1, y + tile - 1], outline=CREAM)
    out = d / "_sheet.png"
    sheet.save(out)
    print("SHEET:", out)


# ---------------------------------------------------------------- manifest
def read_manifest():
    return json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}


def write_manifest(m):
    SPRITES.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(m, indent=2), encoding="utf-8")


def log_process(line):
    if not LOG.exists():
        LOG.write_text("# Process Log\n", encoding="utf-8")
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"\n{line}\n")


def install_sprite(key, img, out_px, version, source, method="auto", skip_cutout=False):
    if not skip_cutout:
        img = cutout(img, method)
        img = trim_pad(img)
    dest, dest2 = SPRITES / f"{key}.png", SPRITES / f"{key}@2x.png"
    SPRITES.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        ad = ARCHIVE / key
        ad.mkdir(parents=True, exist_ok=True)
        shutil.move(str(dest), ad / f"{datetime.datetime.now():%Y%m%d-%H%M%S}.png")
    fit_longest(img, out_px).save(dest)
    fit_longest(img, out_px * 2).save(dest2)
    m = read_manifest()
    m[key] = {"file": dest.name, "file2x": dest2.name, "version": version, "source": source,
              "date": datetime.date.today().isoformat()}
    write_manifest(m)


def cmd_pick(a):
    version, cfg = asset_cfg(a.key, a.version)
    tag = f"{version}_{int(a.nn):02d}"
    src = CAND / a.key / f"{tag}.png"
    if not src.exists():
        sys.exit(f"Not found: {src}")
    model = PRO_MODEL if a.pro else cfg["model"]
    install_sprite(a.key, Image.open(src), cfg["out_px"], tag, model, a.method,
                   skip_cutout=cfg.get("no_cutout", False))
    log_process(f"ART: picked {a.key} {tag} ({model}, {datetime.date.today()})")
    print(f"picked -> public/sprites/{a.key}.png (+@2x)")


def cmd_import(a):
    src = Path(a.path)
    if not src.exists():
        sys.exit(f"Not found: {src}")
    install_sprite(a.key, Image.open(src).convert("RGBA"), a.px, "v0", f"import:{src.name}", a.method)
    log_process(f"ART: imported {a.key} from {src.name} ({datetime.date.today()})")
    print(f"imported -> public/sprites/{a.key}.png (+@2x)")


def cmd_list(_):
    for k, v in read_manifest().items():
        print(f"{k:18} {v['file']:24} {v['version']:8} {v['source']}  {v['date']}")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("gen")
    g.add_argument("key")
    g.add_argument("--version")
    g.add_argument("--n", type=int, default=6)
    g.add_argument("--pro", action="store_true")
    g.set_defaults(f=cmd_gen)
    s = sub.add_parser("sheet")
    s.add_argument("key")
    s.add_argument("--method", default="auto")
    s.set_defaults(f=cmd_sheet)
    k = sub.add_parser("pick")
    k.add_argument("key")
    k.add_argument("nn")
    k.add_argument("--version")
    k.add_argument("--pro", action="store_true")
    k.add_argument("--method", default="auto")
    k.set_defaults(f=cmd_pick)
    i = sub.add_parser("import")
    i.add_argument("key")
    i.add_argument("path")
    i.add_argument("--px", type=int, default=256)
    i.add_argument("--method", default="auto")
    i.set_defaults(f=cmd_import)
    l = sub.add_parser("list")
    l.set_defaults(f=cmd_list)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
