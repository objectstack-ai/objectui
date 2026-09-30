---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's draft autosave saves an edit made while a save is in flight, in every editor that uses it

Studio's editors save drafts on their own, 1.5 s after the last edit, and wait
while a save is already on its way. When that save came back, the editor marked
its draft as saved whatever had been edited in the meantime. An edit made while
a save was in flight therefore stayed on screen and was never saved. This was
measured on a writable package in the Automations pillar (a flow step's label),
the Data pillar (a field added while a draft save, or a column reorder's save,
was on its way) and the Interfaces pillar's page settings.

A save that comes back now marks the draft as saved only if nothing was edited
after it was sent. A later edit stays on screen and goes out in the next save.
This applies to every editor that uses Studio's shared draft autosave: the
Automations and Data pillars, the Interfaces page inspector, and the Interfaces
navigation editor.

The navigation editor used its own edit counter for this check. It now uses the
shared one, which compares the draft itself. So a navigation edit that is undone
while a save is in flight (an item added and removed again) no longer leaves the
navigation marked unsaved for good, with the unsaved-changes guard held and
"Done" unable to close editing.
