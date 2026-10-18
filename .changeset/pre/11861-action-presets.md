---
'@object-ui/app-shell': patch
---

Studio's action "New" menu opens on common actions in plain words, with the blank action under "Advanced" (part of objectui#11861: the actions entry).

"New" in an object's Actions view used to add one action, "New action": an update of this record with no field values yet (objectui#11820). It now opens on four starting points, each an action of a shape the spec already has:

- **Change a picklist field** — asks for a new value of the object's first picklist (its own: never a system, hidden or read-only one), then saves it. It is the declarative record update with that field as its one input (`operation: 'update'`, `params: [{ field }]`), labelled "Change Status" for a Status field, and written at once.
- **Run a flow**, **Open a web page**, **Open a page in a dialog** — a `flow`, `url` or `modal` action. The spec refuses each of these without a `target`, and only the author knows which one they mean. So, like a new validation rule waiting for its condition (objectui#11820), the action is listed as not saved and kept in the panel until the action editor's own Flow name, URL or page input is filled in. The first value given writes it. Delete drops it unsent, and leaving the view before then drops it too.

The menu row for "Change a picklist field" names the field it will ask about. When the object has no picklist the author can change, the row is listed disabled, saying what it needs.

The blank action, still named "New action", is unchanged, one click away under "Advanced". No starting point writes a script.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
