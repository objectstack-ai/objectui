---
'@object-ui/app-shell': minor
---

The props of this package's minimal `AppShell` container are declared and exported as `MinimalAppShellProps` instead of `AppShellProps` (objectui#6349, batch 9). `@object-ui/layout` publishes a different `AppShellProps`: the props of its sidebar `AppShell`, the shell the console composes, which takes `navbar`, `defaultOpen`, `branding` and `rightRail` where this container takes `header` and `footer`. One exported name stood for two props types across the two packages, and layout keeps it.

**Type change, breaking for some consumers.** `AppShellProps` is no longer exported from `@object-ui/app-shell`. Replace `import type { AppShellProps } from '@object-ui/app-shell'` with `MinimalAppShellProps`; the members (`sidebar`, `header`, `footer`, `children`, `className`) are unchanged. The old import fails to compile with TS2305 ("has no exported member 'AppShellProps'"). The `AppShell` component keeps its name.

`MetadataTypeStatus` and `UserDataAdapter` are no longer declared a second time in this package. `MetadataTypeStatus` is re-exported from `@object-ui/react`, which declares the same four statuses (`'idle' | 'loading' | 'ready' | 'error'`) for `MetadataContextValue.getTypeStatus`. `UserDataAdapter` is re-exported from `@object-ui/data-objectstack`, whose `createObjectStackUserStateAdapter` builds exactly the adapter `UserStateAdaptersProvider` injects. Both declarations had the same members as this package's copies, so this package's entry still exports both names with the same shapes, and those imports do not change.

No runtime behaviour changes.
