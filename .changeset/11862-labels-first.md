---
'@object-ui/app-shell': patch
---

Studio, and the app designer's navigation canvas, show a label first and the machine name or id as secondary text, in the places that showed only the machine name or id (objectui#11862).

- **Explain access names its principal as a person.** The Principal line of the result used to print the raw user id. It now shows the user's name and email, with the id beneath it in small monospace text, and does the same for the person an agent acts on behalf of. The name comes from the row the user picker handed back, or else from the same `sys_user` lookup the picker reads. An id that lookup cannot answer still reads as the id.
- **The Access pillar's permission-set list.** Each set shows its label, with its machine name beneath it in small monospace text. A set that has no label, or that is listed only from its pending draft (whose list entry carries no label), reads as its name, as before.
- **The Interfaces navigation rail.** Each entry shows its label, with the machine name of what it opens beneath it. An entry that opens nothing yet reads as "Item N" by its place, never as the `nav_item_N` id the editor gave it, and the nav-item inspector's Label field offers the same wording as its placeholder.
- **The navigation editor's cards.** While you edit an app's navigation (Studio's Interfaces nav editor, and the app designer's navigation canvas), a card for an entry with no label that opens nothing yet reads as "Item N" by its place, never as its `nav_item_N` id, and selecting it titles the selection the same way. A bound entry, an entry with a label of its own and a group read as before.

Nothing that is saved changes: no label is written where the author typed none, and nav item ids are minted as before. Nothing is added to the package entry: no export, prop or language-pack key.
