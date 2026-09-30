---
'@object-ui/types': minor
---

feat(types)!: `DetailViewFieldSchema.options` is the spec's authoring `SelectOptionSchema` (objectui#10296)

The zod mirror of a detail-view field's `options` carried an inline option shape
that admitted a number or boolean `value` — which the TypeScript declaration
(`SelectOptionMetadata[]`) refuses — and silently stripped every other key. It
now reads `SelectOptionSchema` from `@objectstack/spec/data` by reference, per
ruling F1 on objectui#7759: a structural mirror points at the spec's AUTHORING
schema, never at the declaration's runtime read model.

BREAKING for authored detail-view metadata that the old shape let through:

- `value` must be the spec's `SystemIdentifierSchema`: a string matching
  `^[a-z][a-z0-9_.]*$`, at least two characters long. So `open`, `in_progress`
  and `order.created` are accepted, while `Open`, `1st`, `a-b` and `o` are
  refused. A number or boolean `value` is refused with `invalid_type`; write it
  as an identifier string.
- `icon` and `disabled` on an option are refused by name (`unrecognized_keys`),
  as the spec refuses them on object metadata. They were stripped silently
  before, so no renderer ever received them from this surface.
- `description`, `default` and `visibleWhen` are now accepted as the spec
  declares them, where before they were stripped.
- A bare-string `visibleWhen` is canonicalized in the PARSE OUTPUT to the
  spec's envelope `{ dialect: 'cel', source }`. An authored envelope passes
  through unchanged. (objectui's own form select option keeps the bare string;
  this surface follows the spec.)
- A `visibleWhen` envelope without `dialect` (objectui's wire spelling
  `{ source }`) is refused, as is an empty string. On the installed spec
  17.4.0 a whitespace-only string is still accepted; the next spec release
  refuses it.

The TypeScript declaration is unchanged. The one remaining difference between the
two faces, the `visibleWhen` envelope, is recorded in the parity ledger as an
expected divergence against the read model.
