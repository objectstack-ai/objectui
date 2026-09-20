---
'@object-ui/app-shell': patch
---

The permission matrix editor's **environment** door no longer reports an ERROR for a
save that landed (objectui#9484).

At environment scope (no `packageId`) `doSave` re-anchors its display baseline by
awaiting `client.layered` **after** `client.save` has already returned. That read
carried no rejection handler, so a transport failure on it fell into the same `catch`
that renders a failed save — three wrong outcomes at once for a permission write that
had succeeded:

1. the red error strip rendered the transport's message;
2. `resetDraftBaseline` was skipped, so the editor kept claiming unsaved changes and
   the browser's "leave site?" guard kept firing on a record that was already
   persisted;
3. `setDestructive(null)` was skipped, so a forced save left its destructive-change
   confirmation dialog open over a change that had already been committed.

Now a rejection there degrades only the DISPLAY: the save reads as the success it was,
the baseline is re-anchored from the body the server just accepted, the dialog closes,
and the author is told on a separate advisory (amber, `role="status"`) notice that the
confirming read did not answer and the matrix on screen is the saved body rather than a
fresh read. Nothing about what is WRITTEN changes.

The **package** door's pre-save re-read is deliberately untouched and the two are not
unified: there the read happens BEFORE the write and its rejection refuses the write on
purpose (objectui#9420), because merging a package slice onto a stale base would delete
every other package's permission rows.

Also fixed, because consequence 2 does not close without it: `resetDraftBaseline` now
always hands `setDraft` a fresh object. `isDirty` is a `useMemo` keyed on the draft
while its anchor lives in a ref, so re-anchoring to the object that IS the current
draft used to bail out on `Object.is` — the memo never recomputed and the editor went
on reporting dirty against an anchor that already said clean. This was reachable only
where the re-anchor falls back to the saved body, i.e. the arm above.
