# objectui#12620 — grouped grid evidence

Captured from feature commit `ca10b0061`: HotCRM `63db83e` (`objectstack dev --fresh`), the vite console from the feature worktree, Chromium at 1280 x 800, route `/apps/crm_enterprise/crm_knowledge_article` (default view grouped by Category).

DOM readings at capture (from the capture script, not re-derived here):

| capture | tables | thead | bands | band colSpan | header cells | Status header x | Status cell x per band (rows) |
|---|---|---|---|---|---|---|---|
| `knowledge-grouped-1280-light.png` | 1 | 1 | 4 | 11 | 11 | 896 | getting_started: 896 (1), how_to: 896 (1), troubleshooting: 896 (1), api: 896 (1) |
| `knowledge-grouped-1280-light-collapsed.png` | 1 | 1 | 4 | 11 | 11 | 896 | getting_started: none (0), how_to: 896 (1), troubleshooting: 896 (1), api: 896 (1) |
| `knowledge-grouped-1280-dark.png` | 1 | 1 | 4 | 11 | 11 | 896 | getting_started: 896 (1), how_to: 896 (1), troubleshooting: 896 (1), api: 896 (1) |

In the collapsed capture the first band (Getting Started) has `aria-expanded=false` and owns zero rows; the other three bands keep theirs.
