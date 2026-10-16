---
'@object-ui/fields': minor
---

The result type of this package's `toDomProps` is declared and exported as `FieldDomProps` instead of `DomProps` (objectui#6349, batch 11). `@object-ui/core` publishes a different `DomProps`: its general DOM pass-through type, whose default key set forwards `role`, where this package's forwards `name` and `disabled` instead. One exported name stood for two key sets across the two packages, and core keeps it. `FieldDomProps` is not `FieldWidgetDomProps`: that one is the field widget contract's DOM block, the keys a widget may receive; `FieldDomProps` is the generic result of `toDomProps` for whatever props it is handed.

**Type change, breaking for some consumers.** `DomProps` is no longer exported from `@object-ui/fields`. Replace `import type { DomProps } from '@object-ui/fields'` with `FieldDomProps`; it takes the same one type argument and is the same type. The old import fails to compile with TS2724 ("has no exported member named 'DomProps'"). That error's "Did you mean" names the `toDomProps` function, not the replacement; using the function's name as a type fails too (TS2749), so write `FieldDomProps`. The `toDomProps` function keeps its name, and what it forwards is unchanged.

No runtime behaviour changes.
