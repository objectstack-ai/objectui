---
'@object-ui/providers': minor
---

The props of this package's `ThemeProvider` are declared and exported as `ThemePreferenceProviderProps` instead of `ThemeProviderProps` (objectui#6349, batch 10). `@object-ui/react` publishes a different `ThemeProviderProps`: the props of its theme-system `ThemeProvider`, which registers whole `Theme` documents, takes a theme name as `defaultTheme` and the mode as `defaultMode`, and writes the active theme as CSS variables. This package's provider stores one `ThemePreference` (`auto | light | dark | system`) and takes that mode as `defaultTheme`. One exported name stood for two props types across the two packages, and react keeps it.

**Type change, breaking for some consumers.** `ThemeProviderProps` is no longer exported from `@object-ui/providers`. Replace `import type { ThemeProviderProps } from '@object-ui/providers'` with `ThemePreferenceProviderProps`; the members (`defaultTheme`, `storageKey`, `children`) are unchanged. The old import fails to compile with TS2724 ("has no exported member named 'ThemeProviderProps'"). That error's "Did you mean" names the `ThemeProvider` component, not the replacement; using the component's name as a type fails too (TS2749), so write `ThemePreferenceProviderProps`. The `ThemeProvider` component and `useTheme` keep their names.

No runtime behaviour changes.
