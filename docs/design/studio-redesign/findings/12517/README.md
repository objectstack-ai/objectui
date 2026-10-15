# objectui#12517 — evidence

Screenshots for the pending-changes sheet's two postures. This branch is never merged: screenshots do not enter `main`.

Setup: the vite console against a local HotCRM backend (`objectstack dev --fresh`), a writable package `com.qa.posture` created with `POST /api/v1/packages`, holding four drafts of three types (objects `qap_ticket` and `qap_queue`, app `qap_support`, page `qap_home`). Viewport 1280 × 860.

| File | What it shows |
| --- | --- |
| `12517-publish-confirm-dark.png` | Publish opens the sheet to confirm: summary line "4 items · 2 object · 1 app · 1 page", every row expanded, focus on Publish all. Dark theme. |
| `12517-publish-confirm-light.png` | The same, light theme. |
| `12517-changes-review-dark.png` | Changes opens the sheet to review: rows collapsed, no summary line, focus on the list, Publish all present and unfocused. Dark theme. |
| `12517-changes-review-light.png` | The same, light theme. |

Focus and expansion were read from the DOM at capture time (programmatic focus shows no focus ring): confirm read `data-posture=confirm`, four `aria-expanded=true`, active element `draft-changes-publish`; review read `data-posture=review`, four `aria-expanded=false`, active element `draft-changes-list`, in both themes.
