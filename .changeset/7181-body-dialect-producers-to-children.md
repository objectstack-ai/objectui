---
'object-ui': minor
'@object-ui/cli': minor
'@object-ui/components': minor
'@object-ui/runner': minor
---

The VS Code extension no longer ignores a child list spelled `children`, and everything
the platform scaffolds now emits that spelling (objectui#7181).

## The defect, and who it hit

`children` is the spelling ObjectUI declares on four faces: the `BaseSchema` TypeScript
declaration and its zod mirror in `@object-ui/types`, `validateSchema` in
`@object-ui/core`, and the authoring tier's `BASE_PROPS` in `@object-ui/sdui-parser`
(which accepts `children` and does **not** list `body`).

Both readers in the VS Code extension honoured only `body`. So an author who wrote the
spelling the platform blesses got, from the tool meant to be teaching them the format:

- **a blank preview** — `Object UI: Open Preview` rendered the node as an empty card or
  container, with no error and no diagnostic; and
- **children that were never validated** — the validator's recursion never reached them,
  so a child missing its required `type` drew no warning at all.

Both failures were silent in both directions: nothing told the author their file was
being skipped, and nothing told them it was fine. Metadata written to a file by one
party and re-authored by another was simply dropped by the reader.

Both readers now read `children` first and **keep** `body`, so every existing
`body`-spelled document behaves exactly as it did. Nothing is removed and no accepted
spelling is narrowed. The extension's validator also reports diagnostics at the key the
document actually used, instead of addressing them to `.body[...]` in a file that
contains no such key.

## Scaffolders and shipped defaults now emit `children`

The same dialect was being *produced* into files users own, and into components' own
declared defaults:

- `objectui init` — the `app.json` written for every template
- `Object UI: Create New Schema` — every template the VS Code extension writes
- `carousel`, `resizable` and `scroll-area` — the child lists inside their shipped
  `defaultProps`
- the runner's "no index page found" fallback page

Every node type involved already read `children`, so rendering is unchanged; what moves
is the spelling users are handed as their starting point.

⚠️ This is a change to what those tools *emit*, not to what ObjectUI accepts: `body`
remains readable everywhere it was readable before, and a project scaffolded by an
earlier version needs no edit. Retiring the `body` arm is a separate, already-ruled
step and is not part of this release. `pnpm census:body-dialect` is the instrument that
reports where the dialect still lives.

Scaffolded output and shipped defaults are now pinned by tests that discover the
template population from the code, so a template added later is covered without anyone
remembering to extend them.
