# objectui#12915 live evidence (never merge this branch)

The showcase invoice INV-1001 (`showcase_invoice` record `pN918Z8TmrE4lC88`), rendered on its default record page `showcase_invoice_document`. That page declares `print`, and its `record:line_items` block declares `readonly: true`, so the screen and the print preview draw the same read-only `GridField` table.

## Stack (no stubs)

- Backend: the published `@objectstack/*@18.0.0-next.3` via `e2e/live/ci/start-backend.sh`, the showcase app sparse-checked-out from `@objectstack/cli@18.0.0-next.3` = objectstack `2c9bf9430a11`, seeded admin.
- Console: `apps/console` vite dev server on :5180, `DEV_PROXY_TARGET=http://localhost:4010`, which aliases `@object-ui/fields` to its `src`.
- Browser: Chromium `/opt/pw-browsers/chromium` through Playwright (`shoot.mjs`). Print preview = `page.emulateMedia({ media: 'print' })` plus `page.pdf` (A4).
- No stub, no mock, no fixture. Sign-in is the seeded admin through the console's `/api` proxy.
- The `main` leg swapped `packages/fields/src/widgets/GridField.tsx` to its `main` blob `8e7d43f95c17` (= `2cfdc99`) under the same dev server, then restored it to the branch blob `46a85c34211a` (= `bdcf364`).

## Reading (session locale `en`; no currency resolved in this session)

| leg | row | Qty | Unit Price | Amount |
|---|---|---|---|---|
| main, screen and print | 1 | 10 | 150 | **1500** |
| branch, screen and print | 1 | 10 | 150 | **1,500** |
| both | 2 | 4 | 29.99 | 119.96 |

The line columns are untyped in the page and take `number` (`quantity`) and `currency` (`unit_price`, `amount`) from the child fields since objectui#12854. The showcase has no `select` column on an invoice line, so the select label is measured only by the unit pin `GridField.readonlyCells-12915.test.tsx`.

No currency symbol and no fixed two decimals show on either leg: this session resolves no currency, and `displayText`'s currency branch then prints the plain locale number. That is a pre-existing configuration reading, reported, not fixed here.

Files: `main-screen*.png`, `main-print-preview.png`, `main-print.pdf`, and the same for `branch`.
