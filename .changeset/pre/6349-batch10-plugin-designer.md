---
'@object-ui/plugin-designer': minor
---

The row type of the `VersionHistory` timeline is declared as `VersionHistoryEntry` instead of `VersionEntry` (objectui#6349, batch 10). `@object-ui/collaboration` publishes an unrelated `VersionEntry`: a version its `useConflictResolution` hook records, with an `id` and a per-field `changes` diff. This timeline's rows carry a prose `description` and an `isCurrent` flag instead, and one exported name has one declaration.

**Breaking-change note.** Nothing breaks for a consumer of this package: the package entry never exported `VersionEntry`, so no import named it, and the rows keep the same members (`version`, `timestamp`, `userId`, `userName`, `description`, `isCurrent`). Only the type name shown in the published declaration of `VersionHistory`'s `versions` prop changes.

No runtime behaviour changes.
