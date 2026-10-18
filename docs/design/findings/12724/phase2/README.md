# objectui#12724 phase 2 evidence: the v2 build cards (evidence branch, never merged)

Rendered from feature-branch commit 3b053f3c (branch `claude/issue-12724-v2-declared-rows`) at 1280 px, light, zh-CN and en.

How: a temporary dev-server page in `apps/console` (not committed) mounted the REAL `ChatbotEnhanced` under the real `I18nProvider` with the shipped packs, and fed it messages built by the REAL mapper (`uiMessageToChatMessage`) from raw tool parts. The tool outputs are the fixture envelopes in `packages/plugin-chatbot/src/__tests__/fixtures/buildCards.fixtures.ts`, which `buildCards.contract-12724.test.ts` checks against the producer's schema vendored from objectstack-ai/cloud at 69632617. Faked inputs only: those envelopes and a publish-count probe answering 0 (so the result card reads as published). No live build agent was reachable from the container.

| File | Shows |
| --- | --- |
| `*-plan-card-v2.png` | the plan card while it waits: field chips, the format in mono type, the dashed suggested chip, the name-field line, one intent line per view, the assumptions as a list, the sample-data line in the count line |
| `*-plan-card-built-v2.png` | the same card after the build ran (its actions collapse to the built badge) |
| `*-result-card-v2.png` | the result card: the passed/total chip, the verified lines in two columns, the two doors, the next-steps line and the posture sentence |
| `*-design-turn-1280.png` / `*-conversation-1280.png` | the whole page at 1280 px, with the step names as sentences in the phase lines |
