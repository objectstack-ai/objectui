# objectui#12869 evidence

Light theme, zh-CN, Chromium headless at 1280 px. Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.2`, showcase app). Consoles: `main` at `2ec9e2a` and the feature branch, both run from source with vite.

Access: the published backend serves the seeded `admin@objectos.ai` `systemPermissions: []`, so the console's Studio gate stays closed. The drivers rewrite that one read in the browser (`GET /api/v1/auth/me/permissions`), the recipe objectui#12725 phase 3 used. The server still refuses package routes for this account: the branch's create POST is answered `403 PERMISSION_DENIED` (`branch-create-submitted.png`).

- `main-create-advanced.png`, `main-create-scope-open.png`: on `main`, the new-package dialog's 高级 section has a 范围 row offering `cloud`, `system` and `project`.
- `branch-create-advanced.png`: on the branch, the same section has no 范围 row.
- `branch-create-submitted.png`: the branch's create; the POST body was `{"manifest":{"version":"0.1.0","type":"app","name":"Scope Probe","id":"com.default.scope-probe","namespace":"scope_probe"}}`, with no `scope`.
- `branch-packages-list.png`, `branch-view-advanced.png`: Setup → Packages and the view dialog on the branch, with 范围 = `project`, disabled. The list read (`GET /api/v1/packages`) is STUBBED in the browser with one authored `project` row, because the server refuses it for this account.
- `main-studio-landing.png`, `branch-studio-landing.png`: the Studio landing each run started from.
- `create.mjs`, `view.mjs`: the drivers.
