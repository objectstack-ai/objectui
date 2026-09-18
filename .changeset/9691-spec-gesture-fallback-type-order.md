---
'@object-ui/mobile': minor
---

`useSpecGesture`'s `onGesture` fallback payload reports the DECLARED spec
gesture at every arm, not the recognizer's own name (objectui#9691).

The hook builds each fallback payload by spreading the recognizer's runtime
context next to a declared `type`. That context carries a `type` of its own —
the direction-fused recognizer vocabulary — so the three arms that wrote `type`
BEFORE the spread (`pinch`, `pan`/`drag`, `rotate`) had their declared value
overwritten by the recognizer's. `type` now goes last at all three, which is
what the `swipe` arm already did.

**Breaking in exactly one way, and it is worth stating narrowly.** A config that
declares `type: 'drag'` and supplies no `onPan` now receives `type: 'drag'` in
its `onGesture` payload; it used to receive `'pan'`, the recognizer's name for
the same move. That is the one row where the two vocabularies disagree, so it is
the one row where anything observable changes.

The other repaired arms are LATENT, and the declaration would be dishonest if it
claimed otherwise: `pinch`, `rotate` and a declared `pan` name their recognizer
identically, so the overwrite replaced each value with itself and no payload
moves today. They are repaired because the two sides are different vocabularies
that happen to agree — a rename on either one turns them into the `drag` case
silently — not because anything is observably wrong at them now.
