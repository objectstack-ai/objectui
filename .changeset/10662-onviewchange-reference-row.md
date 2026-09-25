---
---

Docs and comments only (objectui#10662). No package is released: no type, no
accept set and no runtime behaviour changes.

- `content/docs/api/schema-reference.md`: the `ViewSwitcherSchema` table taught
  `onViewChange` as an "Expression or callback invoked on view change". The key
  is declared as the NAME of a `CustomEvent` dispatched on `window` with
  `detail: { view }` (objectui#6124), and an expression or a function is not
  that contract. The row now says what the declaration says. `apps/site` is
  private and in the `ignore` list, so nothing under `content/` ships.
- `@object-ui/types` (`views.ts`): the JSDoc of `ViewSwitcherSchema.onViewChange`,
  `FilterUISchema.onChange` and `SortUISchema.onChange` said the key was read
  in the control "as `new CustomEvent(schema.KEY, …)`". Since objectui#10616
  that expression lives only in `notifyViewHandlerChannels`
  (`plugin-view/src/viewHandlerChannels.ts`), which all three controls call.
  Each docblock now names that function as the dispatcher and keeps the
  control as the read site.
