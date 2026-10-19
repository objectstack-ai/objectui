---
'@object-ui/app-shell': patch
---

The by-name object scope no longer records a failed read as a missing object (objectui#13009). A by-name read that obtains no answer (a 5xx, a network drop, a 404 without the `RESOURCE_NOT_FOUND` code) leaves the name unanswered: the scope stays unsettled, `useObjectPresence` reads `unknown` instead of `absent`, and the next read asks again. A not-found answer and a found answer record exactly what they did before, and `getItem` still answers `null` to its callers for both.
