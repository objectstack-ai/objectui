# objectui#12725 phase 2: Data and Automations claim the right slot (live reading)

Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.2`, showcase at objectstack `e5136ff10f1a`, npm 10.9.4, no change needed). Package `com.example.showcase` (read-only, so the inspectors are read-only).
Console: `before` = objectui `34354a4` (port 5191), `after` = branch `claude/issue-12725-pillars-claim-slot` (port 5190). Chromium headless, 1010 x 900 and 1280 x 900.
`copilot` runs stub `GET /api/v1/ai/agents` in the browser with one agent (the community build serves none); `nocopilot` runs do not.

Per shot set: `data-nosel` (Form tab, nothing selected), `data-field` (the Account Name field selected), `data-esc` (Esc), `auto-nosel` (flow open), `auto-node` (the Compose Summary node selected), `auto-esc` (Esc).

Measured from the DOM (slot = `studio-right-slot`):

| run | Data field selected | Automations node selected | flow canvas width |
|---|---|---|---|
| before copilot 1010 | own aside 300 px beside the slot (slot shows the copilot) | `auto-config-drawer` 384 px over the canvas | 470 |
| after copilot 1010 | in the slot, mode props, strip at foot | in the slot, mode props, strip at foot; no drawer | 470 |
| before copilot 1280 | own aside 300 px + slot 360 px (4 columns) | own aside 300 px + slot 360 px (4 columns) | 380 |
| after copilot 1280 | in the slot, mode props, strip at foot | in the slot, mode props, strip at foot | 680 |
| before nocopilot 1280 | own aside 300 px, no slot | own aside 300 px, no slot | 740 |
| after nocopilot 1280 | slot 360 px appears, props | slot 360 px, props | 680 |

After Esc: Data hands the slot back to the copilot (or hides it with no copilot); Automations returns to the flow's Configuration (its empty sentence).
