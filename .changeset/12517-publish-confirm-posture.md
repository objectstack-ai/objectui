---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The Studio's Publish and Changes buttons no longer open the pending-changes sheet the same way.

- **Publish opens it to confirm.** Every pending item is expanded, so the fields and keys each one adds, changes or removes are on screen. A summary line above the list counts what the publish carries, by type (for example "3 items · 1 object · 1 app · 1 page"). Focus lands on Publish all. The header button still publishes nothing by itself; only Publish all in the sheet does.
- **Changes opens it to review.** Items stay collapsed and focus lands on the list. Publish all is still in the footer, unfocused.

Every other place that opens the sheet (the Home page, the draft preview bar and the history timeline) keeps the review behaviour. With nothing pending, Publish stays disabled and says why, as before.

New language-pack keys under `preview.changes`: `summaryItems` (with its plural forms) and `summaryType`, in every shipped locale.
