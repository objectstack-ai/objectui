---
'@object-ui/app-shell': minor
---

The schema-driven condition editor now lints in the scope its host declares
(objectui#8167, director ruling of 2026-09-17, batch #150 item 5 letter B).

**Breaking for consumers constructing `WidgetContext`.** `WidgetContext` gains a
REQUIRED member, `conditionScope: 'record' | 'flattened' | 'none'`. It reaches
the published type surface through `SchemaForm`'s `widgetContext` prop, so any
consumer that builds a `WidgetContext` value in TypeScript stops compiling until
it states a verdict. Semver `minor` rather than `major` because this repository's
fixed release group tracks `@objectstack`'s major and forbids `major` in a
changeset; the break is spelled out here instead.

Nothing changes for a consumer that passes no `widgetContext` at all: the widget
treats an absent context as "no claim made" and forwards no scope, so
`celAuthoring`'s `hint.scope ?? 'flattened'` answers exactly what it answered
before.

What the member buys: `SchemaForm` routes a field to the condition builder by
name convention (`visible` / `hidden` / `disabled` / `visibleOn` / `condition` /
`predicate` / `*When`), so one widget served every metadata type and claimed no
scope. A bare `status == 'done'` typed into an action's **Visible when** linted
clean — and never matched, because the runtime binds the row as the `record`
ROOT. The editor was issuing a receipt the runtime refuses. The verdict now
originates at the host that knows which metadata type is on screen:
`ResourceEditPage` derives it per type from a pinned table carrying the ruled
per-tier verdicts, and a metadata type added without one is a red pin rather than
a silent `none`.
