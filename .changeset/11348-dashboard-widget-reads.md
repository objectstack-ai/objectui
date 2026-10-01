---
---

No release: no runtime behaviour and no exported type moves (objectui#11348).

`@object-ui/plugin-dashboard` and `@object-ui/plugin-designer` stop reading
dashboard widget keys through `BaseSchema`'s `[key: string]: any`, as
preparation for objectui#8347, which removes that index signature. Every edit
compiles with the signature present.

- **`layout`, `title`, `colorVariant`.** The read sites in `DashboardGridLayout`,
  `DashboardRenderer`, `DashboardWithConfig` and the designer's `DashboardEditor`
  preview read these keys off a `widgets[]` entry, whose type is the
  `DashboardWidgetSlotComponentSchema | DashboardWidgetSchema` union. Each site
  now reads through `DashboardWidgetSchema`. That arm declares all three keys,
  taken from the spec's `DashboardWidget` row; the component arm has no spec row
  and declares none of them. The component arm is assignable to
  `DashboardWidgetSchema`, so each annotation is checked by the compiler, which
  is the consumer advice objectui#7952's changeset already
  gives. Nothing is declared on the component arm.
- **`filter`.** The dashboard-filter broadcast in `DashboardRenderer` read
  `filter` off a child node typed `BaseSchema`. It now narrows the node with a
  type guard over the same three `object-*` types first, to the node schema that
  declares `filter`.

The drill-down drawer's `pageSize` is settled in `@object-ui/types` instead, by
a declaration on `ObjectDataTableSchema` with its own changeset; the drawer's
literal is unchanged.
