---
'@object-ui/app-shell': patch
---

Studio's landing page and the permission matrix name the overlay that exists: an environment overlay, not an org overlay (objectui#12171).

ADR-0131 D6 retired ADR-0005's per-organization overlay axis, and the registry flag a read-only package's types are judged by is `allowEnvironmentOverlay`: may an environment overlay an item a package ships. Four strings still named the organization axis. They now name the environment overlay, in English and in Chinese (「环境覆盖」, where they said 「组织覆盖」):

- the page description under "App Builder";
- the hint under "Installed (read-only · browsable)";
- the tooltip on a read-only card's *Customize with an overlay* link;
- the permission matrix's hint on a set a code package ships: its parenthetical said "ADR-0005 forbids per-org overlay of a packaged set" and now says "ADR-0131 D6 forbids an environment overlay of a packaged set". The rest of that hint is unchanged.

Only the wording changes. No string key is added or removed, and which items an overlay can reach is unchanged.
