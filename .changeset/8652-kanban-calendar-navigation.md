---
'@object-ui/types': minor
'@object-ui/plugin-kanban': minor
'@object-ui/plugin-calendar': minor
---

`navigation` is declared on the `object-kanban` and `object-calendar` blocks, by reference to `@objectstack/spec` (objectui#8652). This is the objectui half of the maintainer ruling on that card: the spec declares the key on both element entries from 17.5.0, and objectui now mirrors it.

- `@object-ui/types`: `ObjectKanbanSchema.navigation` and `ObjectCalendarSchema.navigation` are declared on both published faces with the spec's `NavigationConfig` type — the same type the grid, view, gantt and map schemas use. Until now the key was admitted and never examined: `navigation: { mode: 'not-a-mode' }` passed both faces while the spec refused it. It is now refused at `navigation.mode`, and a member the spec does not declare inside the block is refused too. A parse adds no default to the block, so a board or calendar without the key still opens a record in a drawer.
- `@object-ui/plugin-kanban`: the `object-kanban` registration publishes `navigation` in its `inputs`, so the designer offers it.
- `@object-ui/plugin-calendar`: the `object-calendar` and `calendar` registrations publish `navigation` in their `inputs`, and `ObjectCalendar` reads the key without a cast.

What a click does with each member is unchanged. One value has no effect on its own: `page` opens nothing on a board or calendar that no parent view navigates for, and a block written without `mode` resolves to `page`. The published input descriptions say so.
