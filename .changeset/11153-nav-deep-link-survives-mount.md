---
'@object-ui/app-shell': patch
---

fix(app-shell): a shared `?sel=nav:ID` link survives the designer's mount and opens that nav item, without entering editing on a read-only package (objectui#11153)

The nav-item deep link (objectui#2272) never opened anything, in either designer that
carries it: Studio's Interfaces pillar and the metadata editor's `app` page. Each mirrors
its nav selection back to `sel`, and that mirror's first pass runs at mount, before the
app's draft has loaded and with no selection yet, so it deleted the param. When the draft
arrived there was nothing left to apply, and the shared URL opened with no nav item
selected.

Both copies now go through one hook, which keeps the param while it is unapplied and the
draft has not loaded, and applies it once when the draft arrives. An id the app does not
have changes nothing.

Applying the link reads the package's write state. On a read-only package the link
selects the item without entering nav editing, because nav edits autosave and that
autosave is blocked there: opening the editor would take edits on screen and discard
them. The metadata editor shows that selection read-only (the row is marked and the
inspector opens on it); the Interfaces pillar has no view-mode rendering of a nav
selection, so there it is held in the URL. The Studio surface learns the write state from
the package list, a request of its own, so the link waits for that answer instead of
reading "not answered yet" as writable.
