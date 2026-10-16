---
'@object-ui/plugin-list': patch
---

A quick-filter selection restored from the URL now applies when the list's dropdown chips come from the object definition (objectui#12001).

`userFilters: { element: 'dropdown' }` with no `fields` fills its chips from the object definition, and that definition loads after the list mounts. The dropdown bar read the restored selection (`initialSelections`, which the console fills from `uf_*` URL params) only once, at mount, when it had no fields yet. So a shared link such as `?uf_status=open` opened the list unfiltered while the address bar still carried the filter.

Now a field that appears after mount gets the same starting selection it would have had at mount: the author's default, then the restored value, converted to the option's value type, with a single-choice field kept to one value. The chip shows it and the query carries it. Each field gets this once, so a value the user picks or clears afterwards is not overwritten when the definition renders again. As with a restore at mount, the bar reports it through `onFilterChange` and does not call `onSelectionsChange`.

A list with declared `fields` behaves as before. The `tabs` mode was measured and is not affected: its presets come from the view, not the definition. The deprecated `toggle` mode takes no restored selection in any list.

No export, prop, type or language-pack key changes.
