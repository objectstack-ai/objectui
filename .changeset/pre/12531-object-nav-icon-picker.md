---
'@object-ui/app-shell': patch
---

The object designer (Studio's Object Settings) and Setup's app navigation editor pick an icon from the catalog the console ships instead of taking a typed Lucide name, and the icon picker warns on a name that matches no icon (objectui#12531).

- **The object designer's Basics › Icon** and **an app navigation entry's Icon** now mount the console's icon picker, the one the action editor and the Studio's navigation inspector already use: the trigger previews the current icon, and opening it offers a search box over the bundled Lucide set and a grid of matching icons. Picking one writes its name, so the stored value is still a Lucide name string. A navigation entry whose spec member declares no `icon` (a separator) still gets no icon field. Clearing writes what the text field wrote: the object patch sets `icon` to `undefined`, and a navigation entry gets `icon: ''`. The object field's "Lucide icon name (e.g. building, users)" hint is retired with the text field it described.
- **A stored name that matches no icon is warned about, inline, on every mount of the picker** (the object and navigation fields above, the action editor's icon, the Studio navigation inspector's, and the `icon` widget of the generic metadata form): No icon is named “NAME”. Choose one from the list. The trigger is described by the warning for assistive technology. It replaces the "(not in object)" flag the trigger used to show beside such a name, which was the field picker's wording. The name is still shown and kept. Where Studio's Data pillar draws such a name (the rail row and the item header), it still draws the generic glyph it draws for an object with no icon, as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
