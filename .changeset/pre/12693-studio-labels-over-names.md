---
'@object-ui/app-shell': patch
---

Studio names what it shows by label on two more surfaces (objectui#12693).

- **Explain access.** The answer of `POST /api/v1/security/explain` names the principal's positions and permission sets, and the object, by name only. The Principal card's "Positions" and "Permission sets" chips now show each item's metadata label, read once per run from the `position` and `permission` lists, with the name on the chip's tooltip. The verdict banner names the object by the label the object picker already holds. A name with no label, or one the list does not carry, still shows as the name, and so does every name when the list read fails. The request is unchanged.
- **List-view Columns.** In the Interfaces pillar's LIST VIEW properties, a list view stores its columns as bare field names, and each column row showed that name. A row now shows the field's label from the object's field catalog, with the field name on its tooltip and in the secondary text beside it. The stored `columns` stay field names. A column that carries its own `label` keeps it, and a name the catalog does not know still shows as the name. The view and column inspectors that share this column manager show the same label.

Clause-②: no

No published face moves: the package entry exports the same names, no exported prop changes, and no i18n key is added. Only the text the chips, the banner and the column rows draw changes, plus a `title` on each relabelled chip and row.
