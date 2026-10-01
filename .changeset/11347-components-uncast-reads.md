---
'@object-ui/components': minor
'@object-ui/types': patch
---

Eight renderers stop reading node keys that no declaration carries (objectui#11347, the `@object-ui/components` preparation for objectui#8347's removal of `BaseSchema`'s index signature). The installed `@objectstack/spec` has no row for any of these eight node types, so each key was decided by who authors it. No catalog entry, example, docs page, package README or objectstack-shipped document authors any of them.

**Two reads move to the spelling the type already declares.** Neither move adds an alias.

- `input-otp` draws `length` slots. It used to read an undeclared `maxLength` and ignore the declared `length`, so the published 4-digit and 8-digit examples drew six slots each. `maxLength` is no longer read. Write `length`, which defaults to 6.
- `loading` draws its message from the declared `label`. It used to read an undeclared `text` and leave `label` inert. `text` is no longer read. Write `label`.

**Eight reads are retired, because no type declares the key and nothing authors it:**

- `list`: `title`. The list draws no heading.
- `sidebar-menu-button`: `active`. The node no longer sets the button's active state.
- `drawer`: `footer`, `showClose` and `shouldScaleBackground`. The drawer draws no footer and no Close button.
- `dropdown-menu`, `popover` and `sheet`: `modal`.

Each retired key also leaves its registration's `inputs`, and `modal` leaves the seed values in `sheet`'s `defaultProps`. `SchemaRenderer` still spreads unread node keys onto the component as props. So an authored `modal` or `shouldScaleBackground` still reaches the Radix or vaul root, as it already did beside the named read. Refusing those keys is the strict authoring face's job, not a renderer read's.

**Types.** In `@object-ui/types`, the "What it renders instead" lists in the `body` / `children` refusal messages of these node types now name what the renderers read. The docblocks of `LoadingSchema.label`, `InputOTPSchema.length`, `ListSchema` and the four overlay schemas record these changes. No accept set changes, and no member is added or removed.
