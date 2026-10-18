# objectui#12894 evidence: the copilot's change card and applied card (evidence branch, never merged)

Rendered from feature-branch commit `a43f208e` (branch `claude/issue-12894-copilot-draft-card`) at 1280 px, light, zh-CN and en.

How: a temporary dev-server page in `apps/console` (not committed) mounted the REAL `ChatbotEnhanced` under the REAL `I18nProvider` with the shipped packs, inside a 360 px right slot beside a placeholder canvas (the StudioRailCopilot artboard's slot width at 1280). Its messages were built by the REAL mapper (`uiMessageToChatMessage`) from raw tool parts whose outputs are the fixture envelopes in `packages/plugin-chatbot/src/__tests__/fixtures/changePosture.fixtures.ts`, which copy the envelopes objectstack-ai/cloud's `service-ai-studio` writes at cloud `main` `1e3e04f8` (`changesProposedEnvelope`, `postureEnvelope`, `describeEditOps`, `describeLandedChange`, the ZH and EN `authoring-copy.ts` sentences).

Faked inputs only: those envelopes, and the three host doors (`onReviewDrafts`, `onDiscardDrafts`, `onPublishDrafts`) as no-ops. The composer placeholder ("Type your message…") is the component default, because the page passes no console labels; the composer is not part of this card.

| File | Shows |
| --- | --- |
| `*-change-card.png` / `*-change-card-1280.png` | the change card while it waits: 「修改方案 · 2 项」, one row per change (symbol, kind, `object · field`, type and parameters in small type), the amber posture note, 存为草稿 / 调整 |
| `*-applied-card.png` / `*-applied-card-1280.png` | the applied card after the confirm replay: `appliedCard.title`, its lines, 查看变更并发布 and 撤销 |
| `*-applied-card-undo-confirm.png` / `*-applied-card-undo-confirm-1280.png` | the applied card when one other draft is pending: 撤销 clicked, the confirm naming the counts before anything runs |
