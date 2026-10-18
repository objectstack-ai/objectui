---
'@object-ui/types': patch
---

A record-source refusal (`RECORD_SOURCE_REQUIRED`, raised by every arm that requires a record source) now reports the same path every time (objectui#5250).

The refusal's `path` was one array, built when the arm was defined and handed to every issue. zod copies an added issue shallowly and prefixes its `path` in place as the issue climbs out of an array slot or an object key, so the first refusal reported from inside a container rewrote the path of every later refusal of that arm for as long as the module stayed loaded. A process that judges many documents saw the drift: `objectui check` over a project, or `objectui validate` called repeatedly in one process, could report a root refusal at a path like `0 → 0 → 0 → 0`. Each issue now carries its own copy. The refusal, its message and its code are unchanged.
