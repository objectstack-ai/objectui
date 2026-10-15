# objectui#12515 evidence: Form tab Preview renders the draft

Evidence branch only; never merged into main (screenshots do not enter main).

Backend: HotCRM `63db83e` under `objectstack dev --fresh` on a local port, with a writable package `com.default.studio-test` (namespace `st`) created through `POST /api/v1/packages`. Console: the feature worktree's `apps/console` vite dev server pointed at it. Chromium through Playwright at 1280 x 860, light and dark (`colorScheme`).

Fixtures:

- `st_ticket`: draft-only, three draft fields (Subject text, Priority select, Project lookup to `st_project`).
- `st_asset`: published with Asset Name and Serial Number; a pending draft adds Warranty Ends.

| File | Shows |
| --- | --- |
| `before-unpublished-light.png` | main `572bbce`: draft-only object, the banner and "No published definition yet" |
| `before-published-light.png` | main `572bbce`: published object with a draft change, the banner over the published form |
| `after-unpublished-light.png`, `after-unpublished-dark.png` | the branch: the draft-only object's three fields, the Draft preview chip, no toggle |
| `after-published-light.png`, `after-published-dark.png` | the branch: published object, toggle on Draft, Warranty Ends shown |
| `after-published-published-toggle-light.png`, `after-published-published-toggle-dark.png` | the branch: toggle on Published, the two published fields, no chip |
| `before-light-requests.txt`, `after-light-requests.txt` | the `/api` request log of the same drive on main and on the branch |
| `after-projdraft-light-requests.txt` | the branch, after `st_project` was saved as a draft-only object too |
