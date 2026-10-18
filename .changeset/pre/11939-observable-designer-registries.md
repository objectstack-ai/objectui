---
'@object-ui/app-shell': minor
'@object-ui/console': patch
---

The metadata designer registries are observable, so a designer registered after a surface rendered now appears in it (objectui#11939, step 1 of objectui#6795).

The preview, scoped-inspector and default-inspector registries were plain maps read during render with no change notification. A surface that rendered before its designer was registered kept its fallback for good, whatever registered later. objectui#6795 measured this: "still fallback after registration: true | late inspector rendered: false". Each registry now notifies on every registration that changes an entry, and every surface that reads one during render re-renders when its entry arrives:

- the metadata editor (`MetadataResourceEditPage`): its canvas, its scoped and default inspectors, and the switch into design mode for a type with a canvas;
- the embedded item editor's preview;
- the Studio pillars: the Interfaces canvas and inspector rail, the Data pillar's field rail, the Automations canvas and rail, and the designer-missing notices of those pillars;
- the object Settings, Actions and Hooks panels;
- the console's dev-only designer gallery.

Today every built-in designer is still registered when `@object-ui/app-shell` loads, so nothing an author sees changes. This step is what lets a later change load the designers lazily without leaving those surfaces empty.

**Clause-②: yes (widening).** The package entry gains three hooks:

- `useRegisteredMetadataPreview(type: string): MetadataPreview | undefined`
- `useRegisteredMetadataPreviewTypes(): readonly string[]`
- `useRegisteredMetadataInspector(type: string): MetadataInspector | undefined`

Each one reads its registry through React's `useSyncExternalStore` and re-renders the calling component when what it read changes. `useRegisteredMetadataPreviewTypes` returns a frozen, sorted array that stays the same array until a new type is registered. Use these hooks for reads during render. `getMetadataPreview`, `listMetadataPreviewTypes`, `getMetadataInspector` and `listMetadataInspectorTypes` are unchanged: same signatures, same results, and each `list*` call still returns a new array. They read the registry as it is at the moment of the call, so they stay the right read in event handlers and other code that does not render. `registerMetadataPreview` and `registerMetadataInspector` keep their signatures and their overwrite behaviour; registering a type again with the component it already holds notifies no one. No export is removed, and no existing export changes type.
