---
'@object-ui/types': minor
---

feat(types): `ObjectMapConfigSchema` is `.strict()`, so `objectui validate` refuses an undeclared key in an `object-map` node's `map` block (objectui#5157)

⚠️ **The accept set narrows.** `ObjectMapSchema.map` is `ObjectMapConfigSchema`, which used
to be a plain `z.object()`: a key it did not declare was stripped and the node parsed clean.
The card's own typo, `latitudeFieId`, therefore validated clean and was never read, and neither
`objectui validate` nor the runtime named it (only a TypeScript author's compiler did). The block is now closed, as ruled on objectui#5157 (letter A, carrying the earlier
ruling that limits the change to the `map` block):

- **`safeValidateSchema` / `objectui validate`** refuse a `map` block carrying an undeclared
  key with an `unrecognized_keys` issue at `map` that names the key, and exit 1. One level
  down — the node inside a container's `children` — the refusal arrives as an
  `invalid_union` at `children`, and the arm detail `objectui validate` prints under it
  names the key at `children → 0 → map`.
- **`objectui check`** is advisory and only uses validation to recognise a file: a root
  `object-map` document with no structural root key now moves into its "did not validate"
  list; a document whose root carries a structural key (`children`, `className`, …) is not
  validated by `check` and still passes it.
- **The runtime keeps warning, not throwing.** `ObjectMap` still renders; its existing
  `safeParse` of the block now fails, so `[ObjectMap] Invalid map configuration` is warned
  in the console, naming the key.
- `.shape` is unchanged, so `ObjectMap`'s `FLAT_MAP_CONFIG_KEYS` and the view flatten
  whitelists see the same keys.

**Measured breakage: none.** The pre-landing sweep the ruling required found no `map` block
in authored metadata (objectui examples, apps and docs; objectstack examples and apps)
carrying an undeclared key. Its population is held as a fixture in
`packages/types/src/__tests__/object-map-config-strict-5157.test.ts`, which re-parses every
block under the strict schema on each run; the fixture names the commits the population was
enumerated at, and a block added since is not in it.

Other component sub-block schemas are untouched: whether they close the same way is a
separate decision.
