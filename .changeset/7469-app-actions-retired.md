---
'@object-ui/types': minor
'@object-ui/runner': minor
---

feat(types,runner)!: the app node's `actions` array, `AppAction` and `AppActionSchema` are retired; app-level actions are `navigation` items of `type: 'action'`

⚠️ Breaking, marked `minor` under this repo's version-alignment rule (a `major`
in the fixed group would move all of it off the `@objectstack` major).

**`@object-ui/types`.** An `app` node that authors `actions` now FAILS to
validate, with a named refusal at `actions` that points at the replacement, and
a TypeScript literal typed as `AppComponentSchema` that sets `actions` no longer
compiles. The `AppAction` type and the `AppActionSchema` mirror are no longer
exported. `AppMenuItem` and its mirror stay, because the legacy `menu` still
uses them.

The array was an objectui-only shape: free-form header buttons and a user
avatar menu. `@objectstack/spec`'s `AppSchema` is strict and never declared the
key, so the same app document parsed green here and was refused by the
platform. The console loads apps only from the platform, so it could never
receive the array. Only the standalone runner drew it, and its buttons declared
no behaviour to run. The maintainer's ruling (objectui#7469, option C) keeps
one channel for app-level actions:

```ts
navigation: [
  { id: 'quick_create', type: 'action', label: 'Quick Create', actionDef: { actionName: 'quick_create' } },
]
```

The console sidebar dispatches that item by action name. The signed-in user's
menu belongs to the host shell, not to app metadata. `actions` stays declared
as a `?: never` / `retirementTombstone()` pair (ADR-0049), because
`BaseSchema`'s `.passthrough()` would otherwise keep an authored array in
silence.

**`@object-ui/runner`.** The header no longer reads the app's `actions`. It
draws no toolbar button per `'button'` entry and no avatar menu per `'user'`
entry. The notification Bell is now always drawn. Before, it was hidden when a
`'button'` action was authored.

Changeset entries from `adb2a86db`, objectui#7344, objectui#7719 and
objectui#7721 describe `AppAction` as it stood before this retirement. The
`shortcut` refusal from objectui#7719 still applies to the legacy `menu` items. Pinned in `packages/types/src/__tests__/app-actions-retired-7469.test.ts`
and `packages/runner/src/__tests__/LayoutRenderer.chrome-7469.test.tsx`.
