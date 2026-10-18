---
'@object-ui/app-shell': patch
---

Studio names a draft-only item by its label, with the machine name as secondary text (objectui#11862, the remainder after objectui#11906).

Since objectstack 18.0.0-next.0 each row of `GET /meta/_drafts` carries the draft body's own label, or `null` when the body declares none (objectstack#22200). Studio now reads that label off the row. It does not read each item to find it:

- **Access:** a new permission set that exists only as a draft reads as its label in the permission-set list, with its machine name beneath it. It used to read as its identifier (`qa_readers`) after a reload.
- **Automations:** a draft-only flow reads as its label in the flow list.
- **Interfaces:** a nav entry that has no label of its own and opens a draft-only object or dashboard reads as that draft's label. This holds in the nav list, on the edit-mode cards and in the Label placeholder of the nav-item inspector. A published label still wins. The inspector's page, dashboard and report pickers offer a draft-only item as `Label (name)`, as they offer a published one.
- **Pending changes:** each row of the list leads with its label, with the machine name beneath it in monospace. This applies to new and updated items alike. A label given in several languages reads in the console language.

A row whose draft declares no label shows its name alone, as before. Display only: nothing that is saved changes. Nothing is added to the package entry: no export, prop or language-pack key.
