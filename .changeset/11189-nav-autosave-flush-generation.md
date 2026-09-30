---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's nav autosave sends every nav edit it has shown — "Done" sends the edit, and a completing save clears only what it sent

Two ways Studio's Interfaces pillar could show a nav edit on a writable package
and never save it:

- **"Done" inside the autosave's debounce.** The nav autosave only runs while
  nav editing is open, so clicking "Done" within 1.5 s of an edit cancelled the
  pending save. The edit stayed on screen, unsaved, until nav editing was
  opened again, and the unsaved-changes guard stayed held.
- **An edit taken while a nav save was in flight.** The completing save marked
  the navigation clean whatever had been edited meanwhile, and the re-read it
  triggers installed the saved document over the editor. The later edit
  disappeared from the screen, was never saved, and the unsaved-changes guard
  let go of it without a warning.

"Done" now saves an unsaved nav edit at once, waits for a save already in
flight, and closes nav editing once everything shown has been saved. If that
save fails, editing stays open with the error on screen. A completing save now
marks the navigation clean only if nothing was edited after it was sent, so a
later edit stays on screen, keeps the unsaved-changes guard, and goes out in the
next save. A re-read of the same package (after a save, a publish, or a copilot
change) no longer replaces navigation edits that have not been saved yet.
