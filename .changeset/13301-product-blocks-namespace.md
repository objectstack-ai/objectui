---
'@object-ui/app-shell': patch
'@object-ui/cli': patch
---

The console home blocks `hero`, `stat`, `usage-bar`, `checklist` and `tile-grid` register under the `app-shell` namespace, so the console no longer logs a "without a namespace is deprecated" warning for each on every boot (objectui#13301).

Pages keep writing the bare key: `type: 'hero'` still draws the block through the registry's bare fallback. `objectui check` now knows the five `app-shell:` keys as registered, and `objectui validate` refuses them at `type`, so the bare spelling stays the one authorable key.
