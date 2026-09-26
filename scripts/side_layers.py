"""Compose / preview the layered side-view firefly: static body + wing rotated around a hinge.

  python scripts/side_layers.py preview [--body 2] [--wing 2] [--hx .23 --hy .55]
  python scripts/side_layers.py install [same options]   # writes public/sprites + manifest
The game does the same in Phaser: wing sprite with origin (originX, originY) = hinge, rotated with Sine easing.
"""
import argparse
import json
import math
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import art  # noqa: E402

D = art.CAND / "firefly_v6_02_poses" / "side_layers"
OUT = art.CAND / "firefly_v6_02_poses" / "side" / "gifs"
HINGE_ON_WING = (1.0, 0.93)  # seam where the two wings meet, on the LEFT-half crop


def load_body(n):
    return art.trim_pad(art.cutout(Image.open(D / "firefly_side_body" / f"v1_{n:02d}.png").convert("RGBA")))


def load_wing(n):
    img = art.cutout(Image.open(D / "firefly_side_wing" / f"v1_{n:02d}.png").convert("RGBA"))
    img = img.crop(img.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox())
    return img.crop((0, 0, img.width // 2, img.height))  # left half: points up-left / down-left


def paste_wing(canvas, wing, hinge_xy, angle, alpha=1.0, scale=1.0):
    w = wing.resize((max(1, int(wing.width * scale)), max(1, int(wing.height * scale))), Image.LANCZOS)
    hx, hy = HINGE_ON_WING[0] * w.width, HINGE_ON_WING[1] * w.height
    pad = int(max(w.size) * 1.2)
    big = Image.new("RGBA", (w.width + 2 * pad, w.height + 2 * pad), (0, 0, 0, 0))
    big.paste(w, (pad, pad))
    rot = big.rotate(angle, resample=Image.BICUBIC, center=(pad + hx, pad + hy))
    if alpha < 1:
        r, g, b, a = rot.split()
        rot = Image.merge("RGBA", (r, g, b, a.point(lambda v: int(v * alpha))))
    canvas.alpha_composite(rot, (int(hinge_xy[0] - pad - hx), int(hinge_xy[1] - pad - hy)))


# wing angles (PIL: counter-clockwise +). Up ~ -45 deg (toward vertical), down ~ +55 (folded down/back).
FRAMES = {"up": -30, "mid": 12, "down": 58}


def compose(body, wing, hxy, angle, far_lag=8):
    S = 1.6
    W, H = int(body.width * S), int(body.height * S)
    M = int(H * 0.8)
    canvas = Image.new("RGBA", (W + 2 * M, H + 2 * M), (0, 0, 0, 0))
    ox, oy = M, M
    b = body.resize((W, H), Image.LANCZOS)
    hinge = (ox + hxy[0] * W, oy + hxy[1] * H)
    ws = H * 0.5 / wing.height
    # both wings sit BEHIND the body so the hinge / cut edge is hidden by the torso
    paste_wing(canvas, wing, (hinge[0] - 8, hinge[1] - 6), angle + far_lag, alpha=0.6, scale=ws * 0.92)  # far wing
    paste_wing(canvas, wing, hinge, angle, alpha=0.9, scale=ws)  # near wing
    canvas.alpha_composite(b, (ox, oy))
    return canvas


def preview(a):
    body, wing = load_body(a.body), load_wing(a.wing)
    frames = {k: compose(body, wing, (a.hx, a.hy), ang) for k, ang in FRAMES.items()}
    box = frames["mid"].getbbox()
    for f in frames.values():
        b2 = f.getbbox(); box = (min(box[0], b2[0]), min(box[1], b2[1]), max(box[2], b2[2]), max(box[3], b2[3]))
    frames = {k: f.crop(box) for k, f in frames.items()}
    size = frames["mid"].size
    strip = Image.new("RGB", (size[0] * 3, size[1]), art.NAVY)
    for i, k in enumerate(("up", "mid", "down")):
        strip.paste(frames[k], (i * size[0], 0), frames[k])
    OUT.mkdir(parents=True, exist_ok=True)
    strip.save(OUT / "layered_strip.png")
    # smooth sine loop for the gif
    seq = []
    for i in range(24):
        t = 0.5 - 0.5 * math.cos(2 * math.pi * i / 24)  # 0..1..0
        ang = FRAMES["up"] + (FRAMES["down"] - FRAMES["up"]) * t
        f = compose(body, wing, (a.hx, a.hy), ang).crop(box)
        bg = Image.new("RGB", size, art.NAVY)
        bg.paste(f, (0, 0), f)
        seq.append(bg)
    seq[0].save(OUT / "layered_flap.gif", save_all=True, append_images=seq[1:], duration=70, loop=0)
    print("wrote", OUT / "layered_strip.png", OUT / "layered_flap.gif")


def install(a):
    body, wing = load_body(a.body), load_wing(a.wing)
    m = art.read_manifest()
    for key, img, extra in (
        ("firefly_side_body", body, {"hingeX": a.hx, "hingeY": a.hy}),
        ("firefly_side_wing", wing, {"originX": HINGE_ON_WING[0], "originY": HINGE_ON_WING[1]}),
    ):
        art.install_sprite(key, img, 256, f"v1_layers", "gemini-3.1-flash-image", skip_cutout=True)
        m = art.read_manifest()
        m[key].update(extra)
        art.write_manifest(m)
    print("installed firefly_side_body + firefly_side_wing")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("cmd", choices=["preview", "install"])
    p.add_argument("--body", type=int, default=2)
    p.add_argument("--wing", type=int, default=2)
    p.add_argument("--hx", type=float, default=0.27)
    p.add_argument("--hy", type=float, default=0.57)
    a = p.parse_args()
    {"preview": preview, "install": install}[a.cmd](a)
