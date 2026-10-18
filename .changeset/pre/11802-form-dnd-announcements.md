---
'@object-ui/app-shell': patch
---

Studio's form designer tells a screen reader which field it is dragging and where, by name and in the author's language (objectui#11802).

A screen reader heard the canvas's internal ids during a drag, in English whatever the console language: "Draggable item f:name was dropped over droppable area g:new_group". The designer now gives dnd-kit its own sentences for picking a field up, carrying it over a group, dropping it and cancelling, plus the keyboard instructions read when a field card is focused, in en and zh. Each sentence names the field and the group by the labels the canvas shows, through the same object translations, and says the place as "N of M" inside the group: "Name moved to New group, position 1 of 1." The place a drop announces is the place it commits. A drop outside every group, or a cancelled drag, says the field is back where it was, and names that place.

Dragging works as before: which field moves, where it lands and what is saved are unchanged. Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables.
