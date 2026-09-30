---
'@object-ui/plugin-grid': minor
'@object-ui/types': minor
'@object-ui/react': minor
---

`ObjectGrid` takes `onNavigate` as a component prop, and the list channel's navigation callback takes one closed mode token, `'view' | 'new_window'`.

`ObjectGridSchema.onNavigate`'s documentation told programmatic callers to pass it on `ObjectGridComponentProps`, where the grid's nine other callbacks live — but that interface did not declare it, so a host that followed the advice passed a function the grid never called, with no diagnostic. `ObjectGridComponentProps` now declares `onNavigate`, and the grid reads the prop first and `schema.onNavigate` only when no prop is supplied: when both are given, the prop wins. `onRowClick`, when supplied, still takes the row click before either.

The callback's second argument is now `RecordNavigateAction`, a new type exported by `@object-ui/types`: the closed union `'view' | 'new_window'`, where `'view'` opens the record page and `'new_window'` opens it in a new browser tab. It is exactly what `useNavigationOverlay` emits, and the vocabulary `@objectstack/spec` 17.5.0 gives the react-tier `ListView` `onNavigate` callback. The same type now sits on all four faces of the channel — `ObjectGridComponentProps.onNavigate`, `ObjectGridSchema.onNavigate`, `ListViewSchema.onNavigate`, and `UseNavigationOverlayOptions.onNavigate` in `@object-ui/react` — where the three existing faces declared `action?: string` and two of them described it as `'view' | 'edit'`. No branch of the hook passes `'edit'`.

**Clause-②: yes** — one prop added (`ObjectGridComponentProps.onNavigate`), one type exported (`RecordNavigateAction`), and three published callback types narrowed from `(recordId, action?: string) => void` to `(recordId, action: RecordNavigateAction) => void`. What a host has to change:

- A handler you supply that is written `(id, action?: string) => …`, or with no second parameter at all, still compiles unchanged and receives exactly what it received before.
- A handler whose second parameter is annotated with a union that leaves out `'new_window'` — the old documentation's `'view' | 'edit'` is the likely one — is now refused with TS2322. Annotate it `RecordNavigateAction` (or drop the annotation) and handle `'new_window'`, which a Cmd/Ctrl/middle-click and `navigation.mode: 'new_window'` already deliver.
- Code that CALLS one of these callbacks itself must now pass the second argument, and it must be one of the two members.
