---
---

Docs and a test only, no package released. The plugin-view README, `content/docs/plugins/plugin-view.mdx`
and `content/docs/api/schema-reference.md` now teach the spec-shaped named list view: every `listViews`
entry carries `columns`, the one key `@objectstack/spec`'s `ObjectListViewSchema` requires, and the
schema reference's `my-deals` view spells its filter as a `{ field, operator, value }` rule object
instead of the ObjectQL tuple, with the spec's own context token `{current_user_id}` as its value
(objectui#8255, the docs half of the objectui#7928 ruling). `content/docs/guide/building-crud-app.md`'s
`TaskSchema.listViews.active` gets the same filter rewrite.

The `@object-ui/types` pin that held the refused forms as "still what the docs teach" now asserts the
successor: it reads every named view those four pages author off disk with the TypeScript parser and
requires each to parse under `ObjectListViewSchema`, with a positive control that the retired forms
are refused by the same predicate. The spec-side refusal assertions in that pin are unchanged.
