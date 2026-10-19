---
'@object-ui/data-objectstack': minor
'@object-ui/app-shell': minor
---

Studio marks the settings the AI copilot drafted: a Draft chip and a Source line ("Added as a draft by the AI copilot 2 min ago") on a field or a list-view setting the copilot changed, read from the platform's per-key draft provenance (objectui#12725, item 3; objectstack#24298 and #24395).

- **`@object-ui/data-objectstack` reads and writes the provenance.** The strict draft read (`getDraft`) serves `draftChanges` beside `item`: one `{ path, by, actor, at }` per changed key path. New exports beside `extractDraftBody`: `readDraftChanges(resp)` (the envelope's entries, or `null` when the read recorded none, never `[]`), `governingDraftChange(changes, path)` (the entry that answers for a key: the longest prefix), `draftChangesUnder(changes, path)`, and the `DraftChange` type, derived from `@objectstack/spec`'s `GetMetaItemResponse`. `MetadataClientSaveOptions` gains `surface?: 'studio' | 'api'`, sent once as `?surface=`, derived from the spec's `MetadataAuthoringSurface` minus `copilot` (the HTTP doors refuse it). `MetadataDeleteOptions` no longer inherits it: the delete door reads no such parameter.
- **Studio's own draft saves declare `surface: 'studio'`,** so a person's edit there is recorded as `studio`, not `api`.
- **The marks.** The Data pillar's field properties show the chip and the Source line when the field's entry, or an entry under it, is the copilot's. An `object` leaf's list-view properties show the chip on each setting the copilot changed (card fields, title, click to open, group by, columns, filter, sort), mark the elements it added to an array setting by comparing the draft's array with the published one, and end with a Source line naming them. A `studio` or `api` entry draws nothing, and so does a draft whose read recorded no provenance. To compare arrays, the list-view panel reads the published layer beside a draft when, and only when, the draft carries a copilot entry.

The new copy lives in the metadata-admin designer's own string tables (en and zh).
