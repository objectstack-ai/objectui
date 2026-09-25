---
'@object-ui/types': patch
'@object-ui/core': patch
---

The `ObjectGanttSchema` and `ObjectCalendarSchema` record-source text now names
the function their renderers actually call (objectui#9618).

Their zod `.describe` strings and TS docs said the `data` → `staticData` →
`objectName` ladder is resolved by `getDataConfig`. Neither renderer has had a
function by that name since the ladder moved into `@object-ui/core`'s shared
`resolveRecordSourceConfig` (objectui#7632), so the text now names that
function. The ladder order is unchanged, and so is every accepted document.
The `ObjectMapSchema` text still says `getDataConfig`, which is true:
`ObjectMap.tsx` keeps a local wrapper by that name that delegates to the shared
ladder. The `resolveRecordSourceConfig` docblock in `@object-ui/core` now says
that the text it quotes is the map faces' text.
