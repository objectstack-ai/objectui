---
'@object-ui/types': minor
'@object-ui/plugin-dashboard': patch
---

`DashboardComponentSchema.header` and `.globalFilters` now state
`@objectstack/spec`'s `DashboardSchema` member on both faces, the TypeScript
interface and the Zod validator (objectui#7759 group A). Both keys are declared
by the spec, and each face used to refuse something the other accepted.

**`header` (TypeScript interface).** The hand-written restatement is gone. The
interface inherits the spec's `DashboardHeader` through the same
`Omit` projection of the spec `Dashboard` type as its other spec-owned keys. Breaking for code
that builds header actions in TypeScript:

- `actions[].label` is `I18nLabel`: a string or an inline per-locale map. It used
  to be `string`.
- `actions[].actionUrl` is required. It used to be optional.
- `actions[].actionType` is the spec's `ActionType` (`url`, `script`, `modal`,
  `flow`, `api` or `form`). It used to be any string.

The validator is unchanged here: it always took the spec's `header`.

**`globalFilters` (Zod validator).** `GlobalFilterSchema` is now the spec's
`GlobalFilterSchema` by reference, and its local `options` / `optionsFrom`
restatement is gone. Breaking for documents that relied on the looser validator:

- the bare-string option shorthand (`options: ['EMEA']`) is refused with
  `invalid_type` at `globalFilters.N.options.M`. Write
  `{ "value": "EMEA", "label": "EMEA" }`;
- an option with no `label` is refused at `globalFilters.N.options.M.label`;
- an `optionsFrom` with no `labelField` is refused with `invalid_type` at
  `globalFilters.N.optionsFrom.labelField`. Name the value field again if the
  options have no separate label column;
- an `optionsFrom.filter` must be a filter-condition object. An array is
  refused;
- an unknown key in a filter is refused with `unrecognized_keys` at
  `globalFilters.N`. It used to be removed without a message.

Widening: an option `label` may now be an inline per-locale map, which the spec
has always allowed and the filter bar already resolves. The TypeScript type is
unchanged, because it already bound the spec's `GlobalFilter`. The runtime is
unchanged too: `@object-ui/core` still converts a STORED bare-string option into
a pair when it reads the document, and logs a deprecation warning. That
conversion keeps its own retirement schedule (objectstack#7917).

**`@object-ui/plugin-dashboard`.** Before this change, a header action whose
`label` was an inline per-locale map crashed the renderer: React reported
`Objects are not valid as a React child`. The mirror accepted that document.
`DashboardRenderer` now shows the label in the active language, both as the
button text and as the fallback for the
`dashboards.NAME.actions.KEY.label` bundle lookup.

⚠️ **Dated note, 2026-09-29 — the runtime bare-string lift has since retired —
objectui#4356.** Later in this same release `@object-ui/core`'s
`normalizeFilterOptions` stopped converting a STORED bare-string option into a
pair: a `globalFilters[].options` member that is not a `{ value, label }` object
now yields no option, a shorthand-only filter resolves with no `options`, and a
mixed array keeps only its object members; in development a once-per-filter
`console.warn` names the filter and the dropped members. The objectstack#7917
retirement window is closed (maintainer, 2026-09-02, verbatim 「objectstack#7917
不考虑现有数据」). So "The runtime is unchanged too: `@object-ui/core` still
converts a STORED bare-string option into a pair when it reads the document, and
logs a deprecation warning" and "That conversion keeps its own retirement
schedule (objectstack#7917)" above no longer hold; the validator's refusal of
`options: ['EMEA']` described above is unchanged and now matches the read path.
`.changeset/retire-options-shorthand-lift-4356.md` (PR objectui#10930) states
what ships; the text above is kept as the reading of this change.
