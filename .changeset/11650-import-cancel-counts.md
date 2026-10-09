---
'@object-ui/plugin-grid': patch
---

Cancelling a background import shows the rows the server already committed, with Undo (objectui#11650). `ImportWizard`'s Cancel used to show "Import cancelled · 0 imported" without reading the job back, while the job it had just cancelled read `cancelled` with the rows its worker had written. Users took the zero at its word and imported the file again.

After the cancel answers, the wizard now reads the job (`getImportJobProgress`, the `GET /api/v1/data/import/jobs/:id` read). It keeps reading until the outcome is final, at most ten reads, one per poll interval. The result then shows the job's created and updated counts. When the job can be undone, it also shows an **Undo import** button. That button runs the same confirm-and-undo action as the History list and then reads "Undone". A `cancelled` read counts as final once it is undoable, or once it repeats the previous `cancelled` read's counts. The server marks the job `cancelled` before its worker stops writing, so the first read after a cancel can still be short. The poll loop applies the same rule to a job cancelled from elsewhere, and both paths build the result the same way.

**Behaviour change for hosts.** `onComplete` now fires once after a user cancel that reads the job back, with the cancelled result (`cancelled: true` and the committed counts). Before, it fired only when the poll loop itself saw a job end `cancelled`. In the console this refreshes the list, so the committed rows show up, and it raises the usual import toast. If no read settles within the bound, the result still says "Import cancelled", but it shows no count, because the wizard never read one. `onComplete` does not fire in that case, as before. The poll loop and the cancel handler can no longer both publish a result for the same run.

**Undo refreshes the list it changed.** A successful Undo, from the History list or from the cancelled result, now calls `notifyDataChanged` for the imported object. That is the data-invalidation bus from `@object-ui/react`, so a mounted list of that object refetches in place. Before, the list kept showing the rows the Undo had just deleted until something else refreshed it. A failed Undo announces nothing.

**Clause-②: no.** No export, prop, type member or i18n key is added or removed. The new copy reuses the existing `grid.import.importCancelled`, `grid.import.createdCount`, `grid.import.updatedCount`, `grid.import.undoImport`, `grid.import.undoing`, `grid.import.undoConfirm` and `grid.import.reverted` strings.
