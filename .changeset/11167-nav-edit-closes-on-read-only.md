---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's Interfaces pillar closes nav editing when the package answers read-only, so no edit is taken on screen that its autosave will refuse

The Studio surface learns whether a package is writable from the package
list, a request of its own, and while that request is in flight the nav
"Edit" toggle stays on offer (an unknown write state is not read as
read-only). An author who opened nav editing in that window, and the answer
then came back `writable: false`, saw the toggle disappear while editing
stayed open: the nav canvas kept taking edits, and the nav autosave, which is
blocked on a read-only package, never sent them.

The read-only answer now closes nav editing the way the toggle does, and the
nav-item inspector closes with it. An unsaved nav edit taken before the answer
is put back to the navigation as last loaded or saved: the package refuses
authoring, so no autosave could ever send it, and keeping it would leave the
rail showing a navigation the package does not have, with the unsaved-changes
guard held for good. A `?sel=nav:` link that the same answer settles still
selects its item, without editing.

On a writable package, or while the answer is still pending, nav editing
behaves as before.
