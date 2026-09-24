---
'@object-ui/types': minor
---

**BREAKING** — `NamedListView` (one entry of `ObjectViewSchema.listViews`) retires
sixteen members on its TypeScript authoring face (objectui#7924). Each is now a
`?: never` tombstone: a TypeScript author who writes one gets a compile error at that
key, and the member's docblock names the key to write instead.

**The eight legacy `show*` spellings** (bucket ② of the director-seat ruling on
objectui#7924, letter **A**). None is a protocol key on a view; the protocol's
`userActions` and `appearance` blocks are the canonical home, and `NamedListView`
already declares both (objectui#8980), so objectui is not narrower than the protocol
on any of the toggles.

| retired | author instead |
| --- | --- |
| `showSearch` | `userActions.search` |
| `showSort` | `userActions.sort` |
| `showFilters` | `userActions.filter` |
| `showHideFields` | `userActions.hideFields` |
| `showGroup` | `userActions.group` |
| `showColor` | `userActions.rowColor` |
| `showDensity` | `userActions.rowHeight` |
| `showDescription` | `appearance.showDescription` |

```ts
// before
const all: NamedListView = { label: 'All', showSearch: false, showDescription: true };
// after
const all: NamedListView = { label: 'All', userActions: { search: false }, appearance: { showDescription: true } };
```

**Eight members the protocol declares nowhere and no renderer acts on** (bucket ③):
`addDeleteRecordsInline`, `addRecordViaForm`, `clickIntoRecordDetails`,
`collapseAllByDefault`, `color`, `fieldTextColor`, `prefixField`, `wrapHeaders`. Two
tombstones point at a likely intent, with no alias mapping behind either: `color` at the
row-colour configuration `rowColor: { field }`, and `addRecordViaForm` at the
`userActions.addRecordForm` toggle.

**Two bucket-③ members are NOT retired, because each is read:** `allowExport` gates
`ListView`'s export control when the Console relays it off the active named view, and
`densityMode` is folded onto `rowHeight` by `normalizeListViewSchema`. They stay
declared as they were.

**Only the authoring face changes.** Stored view documents that still carry a legacy
spelling keep loading: `normalizeListViewSchema` (`@object-ui/core`) still folds the eight
`show*` flags onto `userActions` / `appearance` at runtime, and hosts that read a stored
view through a loose type are unaffected.

**ADR-0087 disposition:** the eight `show*` spellings are a **D2** conversion. Stored
documents are accepted and converted at load by the existing runtime fold, and the TS
face refuses the old spelling at authoring time. The eight bucket-③ members have **no
conversion**, because the protocol has no equivalent to convert them to. The refusal is
loud and by name on the TS face, and a stored document carrying one stays as inert as
it was before this change.
