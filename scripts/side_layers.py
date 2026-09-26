"""Compose / preview the layered side-view firefly: static body + wing rotated around a hinge.

  python scripts/side_layers.py preview [--body 2] [--wing 2] [--hx .23 --hy .55]
  python scripts/side_layers.py install [same options]   # writes public/sprites + manifest
The game does the same in Phaser: wing sprite with origin (originX, originY) = hinge, rotated with Sine easing.
"""
import argparse
import json
import math

import numpy as np
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


def _homography(src, dst):
    """3x3 H with dst ~ H @ src for 4 point pairs; returns PIL PERSPECTIVE coeffs mapping dst -> src."""
    A, b = [], []
    for (x, y), (u, v) in zip(dst, src):  # solve for inverse map (output -> source)
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    return np.linalg.solve(np.array(A, float), np.array(b, float))


AXIS = np.array([-0.25, -1.0, 0.0])  # body axis (up and slightly back); wings flap about it
AXIS = AXIS / np.linalg.norm(AXIS)


def warp_wing(canvas_size, wing, hinge_xy, theta, phi, scale=1.0, alpha=1.0):
    """3D flap: rotate the wing plane by `theta` (deg) in DEPTH about the body axis, then swing it by `phi`
    (deg, +down) in the image plane, and project with perspective. Returns an RGBA layer of canvas_size."""
    w, h = wing.size
    hx, hy = HINGE_ON_WING[0] * w, HINGE_ON_WING[1] * h
    pts = np.array([(0, 0, 0), (w, 0, 0), (w, h, 0), (0, h, 0)], float) - [hx, hy, 0]
    pts *= scale
    t = math.radians(theta)
    K = np.array([[0, -AXIS[2], AXIS[1]], [AXIS[2], 0, -AXIS[0]], [-AXIS[1], AXIS[0], 0]])
    R = np.eye(3) + math.sin(t) * K + (1 - math.cos(t)) * (K @ K)  # Rodrigues
    a = math.radians(phi)
    Rp = np.array([[math.cos(a), -math.sin(a), 0], [math.sin(a), math.cos(a), 0], [0, 0, 1]])
    D = 2.4 * max(w, h) * scale
    out = []
    for p in pts:
        q = Rp @ (R @ p)
        f = D / (D - q[2])
        out.append((hinge_xy[0] + q[0] * f, hinge_xy[1] + q[1] * f))
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    coeffs = _homography(src, out)
    layer = wing.transform(canvas_size, Image.PERSPECTIVE, tuple(coeffs), Image.BICUBIC)
    if alpha < 1:
        r, g, b, al = layer.split()
        layer = Image.merge("RGBA", (r, g, b, al.point(lambda v: int(v * alpha))))
    return layer


# per-wing flap: independent phase/amplitude. phi: + is DOWN. theta: + is toward the viewer.
def wing_pose(t, near=True):
    c = 2 * math.pi * t
    if near:
        return dict(phi=8 + 42 * math.sin(c), theta=-35 * math.sin(c + 0.9) + 12)
    return dict(phi=14 + 34 * math.sin(c - 1.3), theta=32 * math.sin(c - 0.4) - 30)


def compose(body, wing, hxy, t, **_):
    S = 1.6
    W, H = int(body.width * S), int(body.height * S)
    M = int(H * 0.8)
    size = (W + 2 * M, H + 2 * M)
    b = body.resize((W, H), Image.LANCZOS)
    hinge = (M + hxy[0] * W, M + hxy[1] * H)
    ws = H * 0.5 / wing.height
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    far = warp_wing(size, wing, (hinge[0] - 10, hinge[1] - 14), scale=ws * 0.9, alpha=0.55, **wing_pose(t, False))
    near = warp_wing(size, wing, hinge, scale=ws, alpha=0.9, **wing_pose(t, True))
    canvas.alpha_composite(far)
    canvas.alpha_composite(near)
    canvas.alpha_composite(b, (M, M))  # both wings behind the body: hides hinge / cut edge
    return canvas


def preview(a):
    body, wing = load_body(a.body), load_wing(a.wing)
    ts = [i / 24 for i in range(24)]
    fr = [compose(body, wing, (a.hx, a.hy), t) for t in ts]
    box = fr[0].getbbox()
    for f in fr:
        b2 = f.getbbox()
        box = (min(box[0], b2[0]), min(box[1], b2[1]), max(box[2], b2[2]), max(box[3], b2[3]))
    fr = [f.crop(box) for f in fr]
    OUT.mkdir(parents=True, exist_ok=True)
    pick = [fr[i] for i in (0, 4, 8, 12, 16, 20)]
    strip = Image.new("RGB", (pick[0].width * 3, pick[0].height * 2), art.NAVY)
    for i, f in enumerate(pick):
        strip.paste(f, ((i % 3) * f.width, (i // 3) * f.height), f)
    strip.save(OUT / "layered_strip.png")
    seq = []
    for f in fr:
        bg = Image.new("RGB", f.size, art.NAVY)
        bg.paste(f, (0, 0), f)
        seq.append(bg)
    seq[0].save(OUT / "layered_flap.gif", save_all=True, append_images=seq[1:], duration=60, loop=0)
    print("wrote", OUT / "layered_strip.png", OUT / "layered_flap.gif")


def frames(a, n=12, px=400):
    """Bake the flap into n identical-size transparent frames: sprite keys firefly_side_flap_00..NN (facing right)."""
    body, wing = load_body(a.body), load_wing(a.wing)
    fr = [compose(body, wing, (a.hx, a.hy), i / n) for i in range(n)]
    box = fr[0].getbbox()
    for f in fr:
        b2 = f.getbbox()
        box = (min(box[0], b2[0]), min(box[1], b2[1]), max(box[2], b2[2]), max(box[3], b2[3]))
    for i, f in enumerate(fr):
        art.install_sprite(f"firefly_side_flap_{i:02d}", f.crop(box), px, "v1_baked", "layered-3d-flap", skip_cutout=True)
    m = art.read_manifest()
    m["firefly_side_flap_00"]["frames"] = n
    m["firefly_side_flap_00"]["note"] = "12-frame loop, facing right, identical size/anchor; play ~70ms/frame, flipX for left"
    art.write_manifest(m)
    print(f"installed {n} frames firefly_side_flap_00..{n - 1:02d}")


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
    p.add_argument("cmd", choices=["preview", "install", "frames"])
    p.add_argument("--body", type=int, default=2)
    p.add_argument("--wing", type=int, default=2)
    p.add_argument("--hx", type=float, default=0.27)
    p.add_argument("--hy", type=float, default=0.57)
    a = p.parse_args()
    {"preview": preview, "install": install, "frames": frames}[a.cmd](a)
