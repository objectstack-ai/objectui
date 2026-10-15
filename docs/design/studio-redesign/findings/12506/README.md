# objectui#12506 re-measure — evidence (temporary branch, never merged)

Re-measure of objectui#12506 on objectui main `518a8e308` (carries `c3de0bc`, PR #12502 / objectui#12480),
HotCRM main via `objectstack dev --fresh`, the vite console from the same objectui tree, Chromium
`/opt/pw-browsers/chromium`, viewport 1280 x 900, light and dark.

Result: every body row is 41 px on every surface below, in both themes. The card is a duplicate of objectui#12480.

| file | surface | long-text column (type) | rows | row height |
|---|---|---|---|---|
| `studio-records-crm_account-light.png` / `-dark.png` | Studio Data pillar, Records, `crm_account` | Description (`markdown`) | 9 | 41 px each |
| `studio-records-crm_opportunity-textarea-light.png` / `-dark.png` | Studio Data pillar, Records, `crm_opportunity` | Next Step (`textarea`, row 1 holds two hard line breaks) | 23 | 41 px each |
| `console-crm_account-default-view-light.png` | console list, All Accounts (no long-text column authored) | none | 9 | 41 px each |
| `console-crm_account-with-description-light.png` / `-dark.png` | console list, a local view with Description added | Description (`markdown`) | 9 | 41 px each |
| `console-crm_opportunity-with-next-step-light.png` / `-dark.png` | console list, a local view with Next Step added | Next Step (`textarea`) | 23 | 41 px each |

The `textarea` value "Call the CFO on Monday", a line break, "Send the revised quote", a line break, "Book the onsite demo"
was written to one opportunity on the local backend only. The cell's inner element is `truncate w-full`
(computed `white-space: nowrap`), so the line breaks collapse to spaces and the cell draws one line with an ellipsis.
The cell's `title` holds the full value with both line breaks. The `markdown` cells sit in the
`grid-rich-text-one-line` clamp from #12502, and their `title` holds the full source text.

The two console views were created in a local draft on the `--fresh` backend to put the long-text column on screen.
No HotCRM list view authors a long-text column.
