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

⚠️ **Dated note, 2026-10-01 — the component arm now declares `layout` — objectui#11070.** "the component arm has no spec row and declares none of them" above held when this change landed. Later in this same release, round 11 of objectui#11070 declared `layout` on the component arm, by reference to the spec's widget `layout`, because Save Layout writes it onto every `widgets[]` entry. `title` and `colorVariant` are still declared on the widget arm only. `.changeset/11070-dashboard-keys-round11.md` states what ships; the text above is kept as the reading of this change.

⚠️ **Dated note, 2026-10-02 — the component arm now declares `title` — objectui#11467.** "`title` and `colorVariant` are still declared on the widget arm only" in the note above held when that note was written. Later in this same release, objectui#11467 declared `metric-card`'s registered inputs on the component arm, `title` among them as the card's heading, typed as `MetricCard` reads it. So `title` is declared on both arms, and it reads as `string | I18nLabel` straight off a `widgets[]` entry. `colorVariant` is still declared on the widget arm only. `.changeset/11467-metric-card-arm-inputs.md` states what ships; the text above is kept as the reading of this change.

⚠️ **Dated note, 2026-10-03 — the read sites move to the slot's element type — objectui#11514.** At this change, the `layout` / `title` / `colorVariant` sites above read a `widgets[]` entry through `DashboardWidgetSchema`, and the component arm was assignable to it. Now `DashboardWidgetSchema['type']` names no component type, so the component arm is not assignable to it, and the sites in `DashboardGridLayout`, `DashboardRenderer`, `DashboardWithConfig` and the designer's `DashboardEditor` read an entry by the slot's element type, `DashboardComponentSchema['widgets'][number]`. `layout` and `title` read with their declared types off either arm; `colorVariant` is still declared on the widget arm only. `.changeset/11514-dashboard-slot-entry-types.md` states what ships. The rest of this entry is kept as the reading of this change.

⚠️ **Dated note, 2026-10-03 — the broadcast narrows over two types — objectui#11466.** At this change, the dashboard-filter broadcast's type guard ran "over the same three `object-*` types". Now `object-metric` has left that set: the broadcast narrows over `object-chart` and `object-data-table`, the two node schemas that declare `filter`, and an `object-metric` node in a widget's legacy `component` envelope draws the retired-format placeholder instead (`.changeset/11466-envelope-object-metric-retired.md`). The rest of this entry is kept as the reading of this change.
