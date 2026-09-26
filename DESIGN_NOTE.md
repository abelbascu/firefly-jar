# Design Note

## Added mechanic & why
**Call the fireflies.** Tapping empty night sends out a soft pink ripple, and any fireflies nearby
drift slowly toward that spot (eased, never sudden). It is wordless, has no way to fail, and answers
the most common thing a 4-year-old does: tap where nothing is. A "miss" becomes a small,
pleasant thing that also *helps* (fireflies gather, so the next tap is easier). Uses the very quiet
`tap_miss` sound when that audio exists.

## What I'd build next
- A second gentle reaction: tapping the jar makes the caught fireflies swirl once.
- Final side-view flap frames and colour variants (green/pink) mixed into the swarm.
- Real audio (ambience loop, catch, celebrate) once generated; the code already plays them if present.
- Portrait-specific layout (currently letterboxed 4:3 via FIT).

## What I deliberately cut
- Any score, counter, or text: the jar itself is the only progress display.
- Timers, fail states, or lost fireflies: a caught firefly is replaced by a new one drifting in.
- Dragging fireflies into the jar (too fiddly for small hands; one tap is enough).
