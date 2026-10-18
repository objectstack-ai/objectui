---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

The Create View dialog, the AI build panel's Excel import bar and the API console's method selector pick with the shared `Select`, the control the rest of the console picks with (objectui#11865, the shell and console single selects' part of that card).

Three pickers were browser-native selects, so they looked and behaved differently from the console's other dropdowns: in the Create View dialog, each pick a view type asks for (kanban's group-by field, the date and title fields, the gallery cover, the map coordinates, the tree parent, and the chart's type, dataset, measure and dimension); in the Excel import bar, the object to import into; in the API console, the HTTP method. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Every Create View pick hands the dialog's caller the same view config as before, and the "select a field" option still clears the pick and leaves Create disabled; choosing another dataset still clears the measure and dimension picked from the previous one. Each object in the import bar still imports into that object. Each method still sends the same request, with the body only for POST, PATCH and PUT. Re-picking the current option writes nothing. Each picker keeps the accessible name it had: the Create View picks from their labels, still marked required; the import bar's object picker and the API console's method selector had no label and still have none. A Create View pick with nothing to offer yet, and the import bar with no object to list, are the shared control's disabled trigger.

One display change: a value none of a picker's options carries now shows as itself. The native select showed its first option, or nothing, instead, which is not what the page holds: a Create View pick of a field the object no longer has (Create still writes it), or an import bar opened on an object its list does not return (Import still loads into it).

**Clause-②: no.** No published face moves: neither package's entry or exports change, and no i18n key is added. What moves is these components' own markup, described above.
