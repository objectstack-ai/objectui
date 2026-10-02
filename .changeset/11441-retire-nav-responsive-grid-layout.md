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

⚠️ **Dated note, 2026-10-02 — `grid` takes one of ten `gap` steps, not any number — objectui#11474.** At this change `grid` accepted any `gap` number; now it accepts one of 0, 1, 2, 3, 4, 5, 6, 8, 10 and 12, the steps the `grid` renderer maps, and `objectui validate` refuses any other `G` at `gap` on both faces with that set named: 7, 9, 11, a number above 12, a negative number or a fraction. For such a number `grid` drew no gap anyway, because the class it built at runtime is in no compiled stylesheet. So in the migration above `G` must be one of those ten steps; each step `ResponsiveGrid`'s own class map drew (0 to 6 and 8) is one of them. `.changeset/11474-layout-spacing-sets.md` states what ships. The rest of this entry is kept as the reading of this change.
