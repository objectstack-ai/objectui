---
'@object-ui/plugin-form': minor
---

`object-form.layout` publishes only `vertical` and `horizontal`. This is objectui#11168 slice 3 and delivers objectui#7759 group C. `@objectstack/spec` 17.5.0 retired `inline` and `grid` from the form layout enum (objectstack#20221). The authored `object-form` arm, which reads the spec row by reference, already refused both. The registration still published them, so the page validator passed values `objectui validate` refuses.

⚠️ This narrows a published input. Measured through the real `SchemaRenderer` before the change, `inline` and `grid` rendered byte-identical to `vertical` on the simple, tabbed, wizard and split layouts. Nothing that rendered is lost. A stored document carrying either value is refused at authoring; write `vertical` (the default) or `horizontal`. The fixed group ships the change as `minor`.

The fold that mapped `inline` / `grid` to `vertical` is retired with them, in `ObjectForm` (simple, drawer and modal routes), `DrawerForm` and `ModalForm`. `layout` now passes through unfolded, and an absent `layout` still draws as `vertical`.
