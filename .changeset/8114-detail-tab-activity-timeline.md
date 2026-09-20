---
'@object-ui/plugin-detail': patch
---

The README's Activity tab example names `record:activity`, a block this package
registers, instead of `activity-timeline`, which nothing registers
(objectui#8114).

`README.md` ships in this package's `files`, so the example went out in every
tarball. `DetailTabs` renders a tab's `content` through
`<SchemaRenderer schema={toRenderableSchema(tab.content)} />`, which makes
`content.type` an SDUI node position judged by the component registry — so a
reader copying the tab got the registry's `Unknown component type` panel
(OBJUI-001) where the timeline should be. Same shape as the `line-chart` widget
in `plugin-dashboard/README.md` (objectui#7896's census; fixed by objectui#7951)
and the fourth known instance.

Which type replaces it was read off the registry rather than guessed, using the
repository's own derivation — `deriveRegistryKeys()` from
`scripts/check-doc-component-types.mjs`, the 649-key universe that gate judges
against:

| key | reading |
|---|---|
| `record:activity` | REGISTERED — `packages/plugin-detail/src/index.tsx:673` |
| `activity-timeline` | absent |
| `activity` (bare) | absent — the `skipFallback: true` half |
| `related-list`, `detail-section`, `record:details` | REGISTERED (lit controls) |

Two keys move, because naming the type alone would leave the block fed through a
key it never reads:

- **`type: 'record:activity'`**, namespace spelled out. The registration passes
  the bare name under `{ namespace: 'record', skipFallback: true }`, and
  `skipFallback` is what keeps the bare name unclaimed — `record:activity`
  resolves, `activity` does not. That `activity` is also the tab's own `key` is
  a coincidence of spelling, and the card that filed this read the key as
  evidence there was no such component type.
- **`items`, not `data`.** `RecordActivityRenderer` takes its feed from `items`
  on the node, a mounted discussion context, or a self-fetch from `sys_activity`
  scoped off `useRecordContext`. The last two need a record host and a bare
  `<DetailView>` mounts neither, so the example's own intent — a caller handing
  over a feed it already owns — is the first source. `data` is read on no path.

`activityData` is retyped from `Record<string, unknown>[]` to the exported
`FeedItem`, which puts the block under `check:doc-snippets`. No package source
and no runtime behaviour changes.

**Still ungated, stated so this is not mistaken for coverage.**
`check:doc-types` is the gate that judges `type` literals and it deliberately
does not walk `packages/NAME/README.md` — that widening is objectui#7896's, and
objectui#7896 is blocked by this card. Measured rather than assumed: with an
unregistered type substituted back into this very block, `check:doc-snippets`
and `check:doc-types` both still exit 0.
