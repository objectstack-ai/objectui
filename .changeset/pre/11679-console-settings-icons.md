---
'@object-ui/console': minor
'@object-ui/app-shell': minor
---

The console's settings pages resolve icons through the shared `getLazyIcon` helper and no longer log `[lucide-react]: Name in Lucide DynamicIcon not found` (objectui#11679).

- **Settings hub and namespace pages.** The settings hub, each settings namespace page and its action buttons used the console's own icon helper. That helper passed every name to lucide's `DynamicIcon` without checking that Lucide has it. Its tokeniser also turned `Building2`, the icon the framework's company settings declare, into `building2`, which is not a Lucide name. `DynamicIcon` then logged the error above on the settings hub and on the company page. It drew a bare fallback glyph that ignored the page's sizing classes. The pages now use `getLazyIcon` from `@object-ui/components`: `Building2` shows the building icon, and a name Lucide does not have shows the `Database` fallback at the page's size, with no console error. The console's own helper is removed.
- **App shell icons.** App-shell's internal `getIcon` now re-exports `getLazyIcon` instead of keeping a copy. Its copy already checked the name before calling `DynamicIcon`, but used the same tokeniser, so a digit-suffixed Lucide name such as `Building2` showed the `Database` fallback in the sidebar, app switcher and other shell chrome. Those names now resolve to their own icons. A name that resolved before resolves to the same icon; `lazy-icon-digit-boundary-9414.test.ts` in `@object-ui/components` re-derives that against the installed Lucide on every run.

No export is added to or removed from either package's entry.
