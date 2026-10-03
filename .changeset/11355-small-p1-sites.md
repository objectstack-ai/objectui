---
'@object-ui/types': minor
'@object-ui/cli': patch
'@object-ui/plugin-map': patch
---

Small reader sites stop riding `BaseSchema`'s index signature (objectui#11355, part of the preparation for objectui#8347's removal of that signature). Each key was measured on its own.

**Two keys are now declared, each with a spec row's type, by reference.**

- `ObjectKanbanSchema.swimlaneField`. The installed `@objectstack/spec` declares it on the `object-kanban` row as an optional string, `ObjectKanban` reads it, and the registration publishes it as an input. The TypeScript member takes the row's type, and the zod mirror now refuses a non-string `swimlaneField` where `.passthrough()` used to keep it unjudged. `grouping`, the read's fallback, is still undeclared; aligning it with the spec's typed row is objectui#11216.
- `DetailViewSchema.showHeader`. `detail-view` has no spec row. `DetailView` reads the key, and its producer is `record:details`, which writes its own spec-declared `showHeader` onto the `detail-view` node it builds. So the member takes the `record:details` row's type, and the two cannot drift apart. The zod mirror declares it too. The defaults are unchanged: a bare `detail-view` draws its heading unless `showHeader` is `false`, and `record:details` keeps its own default of off.

**Two reads are typed where they stand, with no behaviour change.**

- `@object-ui/cli`: `objectui validate` reads a parsed node's `title` only where the node carries one. The read used to span every arm of the parsed union. The printed output is unchanged.
- `@object-ui/plugin-map`: the dev warning about flat map keys that a `map` block shadows reads those keys through their own type, not through a `Record` conversion.

**minor, not patch, for `@object-ui/types`.** Both members are new in the shipped `.d.ts` and in the zod mirror's `.shape`, and the mirror now refuses a wrongly typed value for each, where it used to keep one unjudged.

⚠️ **Dated note, 2026-10-03 — `ObjectKanbanSchema.grouping` is now declared — objectui#11216.**
At this change `grouping`, the fallback `ObjectKanban` reads for `swimlaneField`,
was undeclared on both faces, as the first bullet above says. objectui#11216
declares it on both faces in this release, by reference: the TypeScript member is
the spec's `GroupingConfig`, and the zod mirror takes the spec's
`GroupingConfigSchema`, the type the `object-kanban` row gives the key. So the
sentence above that calls `grouping` "still undeclared" does not hold in this
release. The rest of this entry is kept as the reading of this change.
