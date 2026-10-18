---
'@object-ui/app-shell': minor
---

Studio's Add field asks for the label and type before it creates the field, and the field type picker also searches descriptions (objectui#12516).

- **Add field opens a small form.** On the Data pillar, the Form toolbar's Add field and the Records grid's "+" column open the same popover: a required Label, a Type control (the field inspector's searchable type picker, Text preselected), Cancel and Create. Create adds the field with that label and type and opens it in the field inspector, as before. Its api name is derived from the label the way the inspector derives it; when the label derives no name (no Latin letters) or names an existing field, the field gets the next free `field_N`. Cancel, Escape or a click outside creates nothing. A read-only package still offers no Add field.
- **The type picker searches descriptions.** Its search, focused when the list opens, already matched a type's name, category, id and English name; it now also matches the one-line description, on whole words, so `masked` finds Password and Secret while `pick` still finds Picklist alone. A query in Han or Kana matches a description as a substring. Groups keep their headings over their matches, and the arrow keys and Enter pick a type.
