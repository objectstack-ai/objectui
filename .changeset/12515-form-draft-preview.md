---
'@object-ui/app-shell': patch
---

Studio's Data pillar Form tab now previews the draft (objectui#12515).

- **Preview renders the draft definition.** Form · Preview mounts the same runtime form the app uses, built from the object's draft, including edits not yet saved. An object that has never been published now previews its fields instead of showing "No published definition yet". A "Draft preview" chip in the Form toolbar says which definition is on screen.
- **Draft / Published toggle.** When the object also has a published version and the draft differs from it, a Draft / Published toggle sits next to the chip. Published shows the form as the app serves it today.
- **The banner retires.** The yellow "You have unpublished changes" banner and the empty "No published definition yet" state are gone, with their strings.
- **Preview never saves.** A preview form refuses every write, on the Draft and the Published side alike.
