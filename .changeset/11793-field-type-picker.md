---
'@object-ui/app-shell': patch
---

Studio's field inspector picks a field type from a searchable list grouped by category, where it was one flat select of every type (objectui#11793).

The *Type* control shows the field's type with its icon. Opening it lists the types under their categories (Text, Relation, Media and the rest), each row the type's icon, its name and a one-line description of what the type holds. Typing narrows the list: the search matches a type's name as shown, its category, its id (`lookup`, `master_detail`) and its English name, so an author working in Chinese finds a type by the English word too. Arrow keys and Enter choose a type without the mouse.

Choosing a type retypes the field exactly as before. Choosing the type the field already has changes nothing, a read-only field keeps the control disabled, and a stored type the catalog does not list is still shown flagged as not found.

The descriptions are new rows of the metadata-admin designer's own string tables (en and zh), because `@objectstack/spec` carries no per-type description. Nothing is added to the package entry: no export, prop, type member or language-pack key.
