---
'@object-ui/app-shell': patch
---

Studio's landing page names the overlay that exists: an environment overlay, not an org overlay (objectui#12171).

ADR-0131 D6 retired ADR-0005's per-organization overlay axis, and the registry flag a read-only package's types are judged by is `allowEnvironmentOverlay`: may an environment overlay an item a package ships. Three landing strings still offered an "org overlay". They now say "environment overlay", in English and in Chinese (「环境覆盖」, where they said 「组织覆盖」):

- the page description under "App Builder";
- the hint under "Installed (read-only · browsable)";
- the tooltip on a read-only card's *Customize with an overlay* link.

Only the wording changes. No string key is added or removed, and which items an overlay can reach is unchanged.
