---
'@object-ui/plugin-grid': minor
---

fix(plugin-grid): `object-grid`'s `pagination` and `selection` now read their own presence by the SAME rule — presence enables, an explicit off wins

Two adjacent object-armed keys on one block read "am I written?" in opposite
ways, so a rule an author learned on one was exactly wrong on the other, with
no error and no diagnostic on either side:

- `pagination` was read as `!== undefined`. The object's presence hard-forced
  paging ON, which made the deprecated flat `showPagination: false`
  **unreachable** the moment the object was written — a block that cannot turn
  off the thing it names.
- `selection` was read as the optional-chained `type`. Writing the object with
  no `type` member did **nothing** at all; the read fell straight through to
  the legacy `selectable` arm.

Both keys now obey one rule: **presence enables the feature with the object's
settings, and an explicit off wins over presence.**

| authored | before | now |
|---|---|---|
| `pagination: { … }` + `showPagination: false` | paging ON | paging OFF |
| `selection: {}` (no `type`) | selection OFF (legacy arm decided) | selection ON, multiple |
| `selection: { type: 'none' }` | selection OFF | selection OFF (unchanged) |
| `pagination: { … }` alone | paging ON | paging ON (unchanged) |

**Two behaviour changes to check before upgrading.** A page that wrote
`pagination: { … }` beside `showPagination: false` now has its pager removed —
which is what that page asked for. A page that wrote a bare `selection: {}`
now renders selection checkboxes — which is what that page asked for. Neither
is reachable without one of those two authored shapes.

`selection: {}` resolves to `multiple`, the mode this renderer already uses
wherever selection is on and nothing said which kind (the bulk-action
auto-enable arm, and the legacy `selectable: true`). ⚠️ `@objectstack/spec`'s
`SelectionConfigSchema` declares `type` with a `'none'` default of its own,
which this renderer deliberately does not follow — honouring it would make a
written object mean OFF. Metadata that was parsed by the spec bundle before
reaching the renderer therefore arrives carrying an explicit `type: 'none'`
and is read as an explicit off; that seam is carried as an open question on
objectui#9837.

Ruled on objectui#9837 (decision batch #162 item 2, letter A-prime). The two
`object-grid` member pins that asserted the retired readings are rewritten to
the new rule and name what was retired, rather than being quietly edited.
