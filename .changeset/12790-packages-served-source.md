---
'@object-ui/app-shell': patch
---

Setup → Packages reads each package's Source from the server (objectui#12790, ruling B on objectstack#23892).

- **What the Source column reads.** Every `/api/v1/packages` row now carries `source`, stated by the door that registered the package: `code`, `marketplace` or `authored` (objectstack#24010). The Source column and the `?source=` filter read that key as served. The page no longer works the origin out by joining the row's `writable` verdict with the marketplace's installed list, so a package the server calls `authored` reads Authored even when it is not writable (an authored install with a `system` or `cloud` scope), and a package the marketplace lists reads whatever the server states.
- **Refusals.** A row whose `source` is missing, or is not one of the three values, is refused by name with the package's id, and no row is drawn. There is no fallback to the old join. The refusal for a writable package the marketplace also lists is gone, because nothing is left to disagree. A row with no `writable` verdict is still refused, now under its own message, since the Scope badge reads that verdict and it never names a Source.
- **Marketplace rows.** Details and Uninstall stay on the rows the server calls `marketplace`, and an install the runtime did not load still gets its own row with its Not loaded reason and Uninstall. The marketplace's installed list is read for those two things only.
- **Server floor.** A server from before objectstack#24010 serves no `source`, so there the list is refused with the new message on its first row.

Clause-②: no. No export, prop or published locale key changes; the strings added and removed belong to the metadata admin's own table.
