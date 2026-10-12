---
'@object-ui/fields': patch
---

The `position-ref` grant picker no longer offers the `everyone` and `guest` audience anchors (objectui#12200). Every authenticated or anonymous principal holds an anchor implicitly (ADR-0090 D5/D9), and the server refuses a `sys_user_position` row that names one, so a pick of either was refused on save. The picker leaves out exactly the spec's `AUDIENCE_ANCHOR_POSITIONS` from `@objectstack/spec/identity`, loaded lazily, and lists nothing until that list has loaded; a failure to load it shows the usual load-failure notice beside the text box, never an unfiltered list. A row that already stores an anchor still shows it, by its label beside its name, as its own option. `permission-ref` is unchanged: a permission set named like an anchor is listed as before.
