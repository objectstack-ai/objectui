---
'@object-ui/plugin-form': minor
---

`object-form`'s two seed keys now merge PER MEMBER. `initialData` is registered as
the "alternate spelling of `initialValues` … read FIRST", and every presentation
arm implemented that by choosing between the two as WHOLE OBJECTS —
`schema.initialData || schema.initialValues`. `||` tests the object and never its
size, and `{}` is truthy, so the two ways an author loses data were:

- an EMPTY `initialData` — the shape a `?? {}` producer hands over when it has
  nothing to contribute — blanked a populated `initialValues` completely; and
- a PARTIAL `initialData` naming one member dropped every other `initialValues`
  member, including the ones it said nothing about.

Neither produced a warning, a diagnostic or an empty state: the form simply
opened blank where it used to open seeded.

⚠️ **Behaviour change.** A page that used an empty or partial `initialData` to
BLANK a form now gets the merge its description promised — `initialData` wins per
member, `initialValues` supplies the rest. A page relying on the blanking must
stop authoring `initialValues` on that node, or author the blank members
explicitly (an explicit `null` member is still a value, not an absence).

One shared `resolveInitialRecord(schema)` replaces the expression at every read
site across every presentation arm — the flat form, Modal, Drawer, Tabbed, Split,
Wizard and the master-detail parent form, which inherits it. Both read shapes go
through it, and both keep the object schema's declared `defaultValue`s under the
authored record — the sectioned arms at seed time through
`seedCreateValues(objectSchema, …, ctx)`, the flat form one composition later at
render. Neither layers an inline `customFields` member's own `defaultValue`, which
is read from object metadata only. Each site is pinned rather than assumed.

Registration descriptions are unchanged in substance; the two that quoted the
deleted `||` expression now state the per-member precedence instead.
