---
---

Test-only change in `@object-ui/plugin-chatbot`; no published behaviour changes. The display-helper
pins (`humanizeToolName`, `unwrapToolResult`, `summarizeChatError`) move by a pure rename from
`src/__tests__/tool-display.test.ts` to `src/__tests__/tool-display.helpers.test.ts`, so the basename
`tool-display.test.ts` now names one file in the package: `src/tool-display.test.ts`, the
`parseAiQuotaError` and send-error pins, which this change does not touch. A path-filtered run of the
old `__tests__` spelling now fails as a zero-match instead of passing on the helpers alone
(objectui#8130).
