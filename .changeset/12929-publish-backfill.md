---
'@object-ui/data-objectstack': minor
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Studio's Changes drawer can now fill a new field's default into the records an object already holds, when you publish (objectui#12929).

- **The choice.** In the drawer, under a field that a pending draft adds to an already-published object, an unchecked "Backfill default (N existing records)" choice appears when the field declares a literal `defaultValue`. N is the object's record count, read as you. If the count read gives no total, the choice shows no number. A field whose default is a runtime token (`NOW()`, `current_user`) or an expression, a field with no default, and the fields of an object that has never been published get no choice. The publish door refuses those with a 400, and there are no existing records to fill.
- **The publish.** Publish all sends the checked fields as the protocol's opt-in `backfill` (objectstack#24253). The server writes each field's default into the existing records that have no value, as you, with permissions and record hooks applied. The publish toast then shows the rows the server says it wrote for each field. If a field stopped short, the toast is a warning that gives the server's reason, and the publish still stands. If nothing is checked, the publish request is `{}`, the same as before, and no existing record is written.
- **`MetadataClient.publishPackageDrafts(packageId, options?)`** (`@object-ui/data-objectstack`) takes `options.backfill`, an array of `{ object, field }`. Its type is picked from `@objectstack/client`'s `packages.publishDrafts`. The method sends `backfill` only when it is given. The receipt is `backfillApplied` on the result. A call without options sends the `{}` body it always sent.
- **New strings:** `preview.changes.backfillOption` (a count family) and `preview.changes.backfillOptionNoCount` in all ten `@object-ui/i18n` packs. The Studio table gains `engine.studio.backfillWritten` and `engine.studio.backfillStopped` (en and zh).
