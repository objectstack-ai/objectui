---
'@object-ui/react': minor
---

`UseNavigationOverlayOptions.onRowClick` now declares the modifier payload it
has always been called with (objectui#9357).

`useNavigationOverlay`'s `handleClick` invokes the caller-supplied `onRowClick`
with two arguments — the record, and the optional `HandleClickModifiers`
payload (`metaKey` / `ctrlKey` / `button`) a host needs to implement
Cmd/Ctrl/middle-click. The option declared only the record, and `handleClick`
carried a type assertion that widened the value at the call site so the code
would compile. The second argument was therefore invisible on the one line a
host reads, and a host that wanted it had to discover it from the
implementation and then spell its own second parameter optional to stay
assignable.

The declaration now names both parameters and the assertion is gone.

**Source-compatible in both directions, with one measured exception.** A
one-parameter handler stays assignable to the widened signature (its extra
parameter is optional), and a handler written against the widened signature was
already assignable to the old one — measured on this change, both directions.

**The exception, and the one class that has to change.** A handler passed
*directly* to `useNavigationOverlay` whose second parameter is annotated
*narrower* than `HandleClickModifiers` no longer type-checks. React's
`MouseEvent` is the shape this hits in practice, because until now the payload
was only discoverable from the implementation, so a host that wanted it wrote
the annotation it saw arrive:

```ts
useNavigationOverlay({
  objectName: 'account',
  // was accepted; now TS2322 — `HandleClickModifiers` is not assignable to
  // `React.MouseEvent`
  onRowClick: (record, ev?: React.MouseEvent) => { /* ... */ },
});
```

It compiled before only because the old declaration had no second parameter to
check the annotation against. The parameter is checked contravariantly, so the
annotation now has to *admit* `HandleClickModifiers`. **The fix is one line at
the call site:** annotate the parameter `HandleClickModifiers` (exported from
`@object-ui/react`), or drop the annotation and let it be inferred. Either way
the handler keeps receiving exactly what it received before — this is a
type-level change only, with no runtime behaviour attached.

No caller *inside this repository* is in that class, and the repository's own
type-check re-derives that on every run rather than this sentence asserting it;
a host that reaches the hook through a view component's `onRowClick` prop is
unaffected either way, because the prop's own declared type is what gets
assigned to the option. The boundary is pinned as a `@ts-expect-error` row in
this package's `useNavigationOverlay.onRowClickArity-9357` test, so it cannot
move without a red check.

What the widening buys everyone else: a caller who wants the modifier payload
can now see, from the published type, that it is there.

Scope note: this repairs the hook's own option. The pass-through props on the
view components that feed it — `ObjectKanban`, `ObjectGallery`, the
`plugin-kanban` renderer's `onCardClick`, and the `onRowClick` prop on the other
view plugins — each still declare one parameter on their own published face;
which spelling that family converges on is objectui#9357's open question and is
not decided here.
