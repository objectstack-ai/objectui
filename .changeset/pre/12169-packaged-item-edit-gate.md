---
'@object-ui/app-shell': patch
---

On a metadata type the `OS_METADATA_WRITABLE` hatch elevates, an item a package ships now opens read-only in the metadata editor and in the permission matrix, and an item no package ships stays editable (objectui#12169).

The hatch opens a type's items that no package ships, and never an item a package ships (ADR-0131 D6). The type's `allowEnvironmentOverlay` is `true` either way, so it cannot tell the two apart. The server can: the layered item read (`GET /meta/:type/:name/layers`) serves `editable`, its own write verdict for that item. The two gates that read the type flag alone now also read it:

- **The metadata editor's designer.** A designer-capable type (for example `agent`) opened its sealed packaged item straight into design mode: the canvas took edits, the page reported unsaved changes, and there was no Save. The design-mode switch now reads the same item gate as Save, which already read `editable`. An item the server refuses for its own ADR-0010 lock no longer opens in design mode either.
- **The permission matrix's artifact tier.** At environment scope, a packaged permission set of a hatch-elevated `permission` type offered live checkboxes and a Save that the server refused (403 `NOT_OVERRIDABLE`). It is now read-only, names the artifact tier as the reason, and offers "Clone to customize", as it does for a packaged set when the hatch is off.

Neither gate reads `overrideSource`: the served answer decides. A server that sends no `editable` keeps the previous behaviour. The writability badge is unchanged: its tooltip on a hatch-elevated type already says the hatch never opens an item a package ships.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
