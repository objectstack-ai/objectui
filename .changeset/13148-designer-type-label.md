---
'@object-ui/app-shell': patch
---

Studio form designer: each field card's type tag now names the type the way the type picker and the field inspector do (objectui#13148). A Picklist field read "Status SELECT" on the canvas while the type menu and the inspector's Type control called it "Picklist"; the tag showed the spec type id the metadata stores. It now shows the type's display name in the designer's language ("Picklist", "Lookup", "User", "Date"; "下拉选择" in Chinese), still drawn in capitals. A type the catalog does not list is shown as itself. The control preview and the full-row span of wide widgets are unchanged.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The names are the designer's existing `engine.fieldType` rows.
