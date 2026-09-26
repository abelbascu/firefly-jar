# Approved assets (source of truth for the game code)

Load ONLY by key via `public/sprites/sprites.json` (Preloader already does this). Files live in `public/sprites/`
as `<key>.png` (+ `<key>@2x.png`, used when devicePixelRatio > 1). All are transparent PNGs; scale with
`setDisplaySize` using the source aspect ratio so @1x/@2x look the same. Guard with `textures.exists(key)`.

## Sprites (approved)
| Key | What | Use |
|---|---|---|
| `firefly` | Main firefly, front-facing, clay/plush style | default / idle fallback |
| `firefly_pose_idle` | Front, hovering, wings mid | idle when hovering |
| `firefly_pose_wings_up` / `firefly_pose_wings_down` | Front, flap frames | optional 2-frame front flap |
| `firefly_pose_happy` | Arms up, closed-eye smile | caught / celebration |
| `firefly_pose_sleepy` | Eyes closed, wings folded | optional (rest / reset) |
| `firefly_alt_green`, `firefly_alt_pink` | Colour variants (front) | variety of fireflies |
| `firefly_side_flap_00` … `_11` | Side view, facing RIGHT, 12-frame flap loop | travelling; ~70 ms/frame, loop; `flipX` to face left |
| `jar` | Glass jar (v0 import) | jar; glow drawn in code |

`firefly_side_flap_*` frames are identical size with a fixed body anchor: the body never moves, only the wings.
Do NOT bob the sprite by large amounts (calm, small Sine bob only).

## Audio
None approved yet (candidates only). Guard with `cache.audio.exists(key)`; keys will be: catch, jar_fill, celebrate, tap_miss, ambience.

## Not approved / archived
Everything under `assets/_archive/` and `assets/_candidates/` is NOT for use.
