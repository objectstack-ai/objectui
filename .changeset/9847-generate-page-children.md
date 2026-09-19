---
'@object-ui/cli': minor
---

`objectui generate page` scaffolds its child list as `children` (objectui#9847).

## What changed

`objectui generate page NAME` writes a `pages/NAME.json` into a project directory the
user then owns and re-authors. Its child list was spelled `body` — the dialect
objectui#6771 retires.

The asymmetry that makes the spelling matter is in the authoring tier: `BASE_PROPS` in
`@object-ui/sdui-parser` accepts `children` and does **not** list `body`. `BaseSchema`
and its zod mirror in `@object-ui/types` declare *both* keys today, and `validateSchema`
in `@object-ui/core` reads `children` first and falls back to `body`; retiring that
fallback is objectui#6771's own later step and no part of this release.

The scaffolded page now spells it `children`. Nothing else about the file moves.

⚠️ This changes what the tool *emits*, not what ObjectUI accepts. `body` remains
readable everywhere it was readable before, and a page scaffolded by an earlier version
needs no edit. Retiring the `body` arm is a separate, already-ruled step and is not part
of this release.

## Why it was missed

objectui#7181 moved the `body` dialect off the platform's producers, working from a
table of six files. `generatePage` is a seventh producer of exactly the same shape —
code that emits `body`-spelled metadata into a file a user then owns — and that table
never named it, so a migration round aimed at its own family passed it over.

The ordering constraint it sits under is the family's own: once the authoring tier
teaches `children` only, a scaffolder still emitting `body` hands a new user a project
that their very next `objectui validate` rejects.

## What now re-derives this instead of remembering it

- A new pin runs `objectui generate` into a throwaway directory and reads the bytes back
  out, rather than reading this repo's source text — a source-text assertion over a file
  that documents the construct it asserts on passes off the comment, measured elsewhere
  in this family. Its type population is discovered from the line `generate` prints for
  an unknown type, so a type added later is covered without anyone extending the pin.
- `pnpm census:body-dialect` remains the instrument that reports where the dialect still
  lives. The census pins keep their named-producer list — it is the drift guard — and now
  assert over the instrument's *population* beside it, so a producer arriving in a file
  nobody listed fails the suite without anyone remembering to extend that list.

⛔ This does not clear objectui#6771's step 4. The census's own stated limits keep two
producer-shaped sites out of its reach, and both are still live; the census pins name
them, and objectui#9847's delivery reports them.
