---
'@object-ui/app-shell': patch
'@object-ui/core': patch
---

A `dependsOn` declared on a field-backed **lookup action param** now gates, **ungates**
and filters the picker (objectui#8672, maintainer ruling — director decision batch #115,
2026-09-11, arm A "wire it").

**What was broken.** `ActionParamDialog` threaded its live record (`dependentValues`) to
the option widgets only — `select` / `multiselect` / `radio` / `checkboxes`. A `lookup`
param is in none of those, so `LookupField` fell through to the `SchemaRendererContext`
tail that is unconditionally `{}` (nothing can populate a member the type does not
declare), `dependenciesMissing` could never clear, and the trigger rendered **disabled
forever** — prompting for the very field the user had just filled. There was no error at
author time, at type-check or at runtime: the failure looked like a broken picker rather
than a key that did nothing here.

Independently, the one route the repo's own `RESOLVED_ONLY_PARAM_KEYS.dependsOn` message
points authors to ("make the param field-backed to pick it up") read the **snake**
spelling `field.depends_on`, which `@objectstack/spec`'s `FieldSchema` refuses by name,
while the camel `dependsOn` it declares was never read. The two spellings were disjoint,
so no spec-valid document could reach the feature at all.

**What changed.**

- `ActionParamDialog` now supplies its live `values` to the reference-bearing pickers as
  well as to the option widgets. That is the dialog's whole record: unlike the grid
  (`ctx.pendingRow ?? ctx.row`) it is not scoped to a row — its params *are* the record,
  which is the same record its option widgets have resolved against since objectui#3765.
- `resolveActionParams` reads the declared `field.dependsOn` and no longer reads
  `field.depends_on`. Unlike its five sibling lookup keys the snake leg is removed rather
  than demoted, because there is no producer to protect: no document that parses can
  carry a spelling `FieldSchema` rejects by name.

Nothing about the cascade itself is new. `LookupField` has always turned `dependsOn` into
a hard `$filter` shared by the quick-select popover, the Level-2 table picker and
PeoplePicker; this supplies the one input no host could otherwise deliver.

**Unchanged on purpose.** `ActionParamSchema` still refuses `dependsOn` written *inline*
on a param — the honoured route is the field-backed one. `CASCADE_OPTION_WIDGET_TYPES`
gains no member: it is shared verbatim with the object form's cascade-clear loop and with
`plugin-grid`'s `BulkActionDialog`, and it means "this widget's offered *option set* is
re-resolved", which a lookup has none of. The dialog ORs a second family beside it
instead — the shape the object form has shipped all along. The bulk action dialog is
untouched and still carries the original gap.
