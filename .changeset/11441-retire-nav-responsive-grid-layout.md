---
'@object-ui/layout': minor
---

refactor(layout)!: retire the `navigation-renderer` and `responsive-grid` node type keys; navigation is application metadata, and the breakpoint grid is `grid` (objectui#11441)

**BREAKING (authoring):** `registerLayout()` no longer registers `NavigationRenderer` under `navigation-renderer` or `ResponsiveGrid` under `responsive-grid` (and with them `layout:navigation-renderer` and `layout:responsive-grid`). This executes the maintainer's ruling on objectui#11441 (letters B / B) as one more batch of objectui#10859. `objectui validate` already refused both keys at `type`, and nothing in this repository or in objectstack authored or emitted either node. A node of either type now renders the "Unknown component type" panel. `registerLayout()` now registers two keys: `layout:page:card` and `app-schema-renderer`.

`NavigationRenderer` and `ResponsiveGrid` stay named exports for JSX composition. `NavigationRenderer` is what the console's sidebar and `AppSchemaRenderer` mount. `ResponsiveGrid` had no in-repo consumer other than the retired registration, and it stays because the same ruling keeps objectui#7580's vocabulary half: `BreakpointColumnMap` stays declared in this package as the type of its `columns` prop.

Migration, measured against `objectui validate` on both of its faces:

- `{ "type": "responsive-grid", "columns": C, "gap": G }` → `{ "type": "grid", "columns": C, "gap": G }`. `grid` accepts the same breakpoint `columns` object (`xs` … `2xl`) and a `gap` number, and refuses an unknown breakpoint key as an unrecognized key (`unrecognized_keys` on `columns`). Unlike `responsive-grid`, which drew `not-a-container` and rendered no authored child list, `grid` draws its `children`;
- `{ "type": "navigation-renderer", "items": I }` has no page-node replacement: navigation is application metadata. Put `I` in the app document's `navigation` (`{ "type": "app", "name": N, "navigation": I }` validates on both faces), and the shell draws it: the console's sidebar, or `AppSchemaRenderer` in JSX;
- `basePath` has no app-document spelling: the strict face refuses it as an unrecognized key. It belongs to the shell, as `AppSchemaRenderer`'s `basePath` prop.

**Clause-②: yes** — two registrations leave the runtime (narrowing), released as `minor` with this banner.
