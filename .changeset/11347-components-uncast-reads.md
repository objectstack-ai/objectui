---
'@object-ui/components': minor
'@object-ui/types': minor
---

Eight renderers stop riding `BaseSchema`'s index signature for node keys their types did not declare (objectui#11347, the `@object-ui/components` preparation for objectui#8347's removal of that signature). The installed `@objectstack/spec` has no row for any of these eight node types, so each key was decided by who authors it. Only one of them has a producer: the published `skills/objectui` expressions guide authors `title` on a `list` node. No catalog entry, example, docs page, package README or objectstack-shipped document authors any of the others.

**One key is kept and declared.** `ListSchema.title` is now declared on both faces, as an optional string. The `list` renderer keeps drawing it as a heading above the list, and the `list` registration keeps publishing it as an input. The zod mirror now refuses a `title` that is not a string, where `.passthrough()` used to keep it unjudged.

**Two reads move to the spelling the type already declares.** Neither move adds an alias.

- `input-otp` draws `length` slots. It used to read an undeclared `maxLength` and ignore the declared `length`, so the published 4-digit and 8-digit examples drew six slots each. `maxLength` is no longer read. Write `length`, which defaults to 6.
- `loading` draws its message from the declared `label`. It used to read an undeclared `text` and leave `label` inert. `text` is no longer read. Write `label`.

**Seven reads are retired, because no type declares the key and nothing authors it:**

- `sidebar-menu-button`: `active`. The node no longer sets the button's active state.
- `drawer`: `footer`, `showClose` and `shouldScaleBackground`. The drawer draws no footer and no Close button.
- `dropdown-menu`, `popover` and `sheet`: `modal`.

Where a registration published a retired key as an input, the input goes too: `active` on `sidebar-menu-button`, the three `drawer` keys, and `modal` on `popover` and `sheet`. `dropdown-menu` never published `modal`. `sheet`'s `defaultProps` also loses its `modal` seed. `SchemaRenderer` still spreads unread node keys onto the component as props, so an authored `modal` or `shouldScaleBackground` still reaches the Radix or vaul root, as it already did beside the named read. Refusing those keys is the strict authoring face's job, not a renderer read's.

**Types.** In `@object-ui/types`:

- `ListSchema` gains `title?: string` on both faces.
- The "What it renders instead" lists in the `body` / `children` refusal messages of these node types now name what the renderers read.
- The docblocks of `LoadingSchema.label`, `InputOTPSchema.length`, `ListSchema.title` and the four overlay schemas record these changes.

Apart from `ListSchema.title`, no member is added or removed and no accept set changes.

**minor, not patch — the published face gains a member.** `ListSchema.title` is a new member of the shipped `.d.ts` and of the mirror's `.shape`, and the mirror refuses a non-string `title` by name, the class objectui#7722 graded `minor` on this same schema.
