---
'@object-ui/plugin-detail': patch
---

Honour `showBorder` on `DetailSection`'s collapsible branch (objectui#9218).

A section authored with both `collapsible: true` and `showBorder: false` kept its
border and shadow. `DetailSection` ends in three returns and the key was read on
exactly two of them: the flat branch and the non-collapsible `Card` branch. The
collapsible branch wrapped a **bare** `<Card>` and never mentioned `showBorder`, so
the declaration was structurally unreachable there. The collapsible `<Card>` now
carries the same decision branch 2 already made — `border-none shadow-none` when
`showBorder === false`.

**Patch, and the level is measured rather than intuited.**

- *Nothing stops rendering.* No node, prop, export or registration moved. The diff
  is one `className` on one existing `<Card>`.
- *Nothing stops type-checking.* `showBorder` was already declared on all three of
  its surfaces — `DetailViewSection` in `@object-ui/types`, its Zod mirror, and the
  `detail-section` registration's `inputs` — and none of them is touched. This change
  makes the implementation catch up with a declaration that already shipped.
- *What an author authored today changes visually, and only in the direction they
  asked for.* A node carrying `collapsible: true` + `showBorder: false` already
  passed `sdui-parser`'s `validateTree` clean and then drew a border anyway; it now
  draws none. The only behaviour that regresses is a border that was present because
  the key was being dropped, which is the defect itself — so this is not a breaking
  change and does not need a `**BREAKING**` carrier. A census of this repository
  found zero authored `detail-section` nodes under `examples/`, `apps/` or `content/`,
  so no in-repo page changes appearance.

`className` deliberately stays on the outer `Collapsible` where it already was;
relocating it is a different behaviour that objectui#9218 did not measure, and a
drift guard now reds if a later change moves it.
