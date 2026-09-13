---
---

Test-only: the `RecordApprovalsPanel` `via_override` pin now settles on the timeline rows it asserts rather than on the panel shell, and its two failure causes ("the rows have not arrived" vs "the chip is no longer rendered") report as two different messages. No published behaviour changes — no file outside `packages/app-shell/src/views/RecordApprovalsPanel.viaOverrideMarker.test.tsx` was touched.
