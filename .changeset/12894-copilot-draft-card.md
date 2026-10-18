---
'@object-ui/plugin-chatbot': minor
'@object-ui/i18n': minor
---

**The copilot's change card says when a change will be saved as a draft, and the applied card offers review and undo** (objectui#12894).

- **The change card.** When the copilot proposes a change, the card is headed 「修改方案 · 2 项」 / "Change plan · 2 changes" and lists one row per change: a ＋ / ✎ / － symbol, the kind (字段 / 视图 …), the object and field it touches, and its type and parameters in small type (「number · 续借次数 · 默认 0 · 不必填」). For an app that is already live and holds records, the change is saved as a Studio draft: the card says so in an amber note, and its main button reads 「存为草稿」 / "Save as draft".
- **The applied card.** After you confirm, the card shows what happened, for example 「已存为草稿 · 2 项未发布」 with 「已有 12 条记录的续借次数为空」 and 「核对：结构 ✓」. It offers 「查看变更并发布」 / "Review changes and publish" and 「撤销」 / "Undo" when the host provides them. Undo discards every unpublished draft of the app package, so when other drafts are pending the button says how many, and the card asks before it runs.

Each of these reads a field the copilot's tools now send. When an older version does not send it, the card looks as it did before.

`@object-ui/plugin-chatbot`: `ProposedChanges` gains optional `posture` and `primaryAction`; `ReplayOutcome` gains optional `draftState`, `existingRows` and `appliedCard`; `ChatbotEnhancedToolInvocation` now references both types instead of repeating them; `ChatbotEnhancedProps` gains optional `onReviewDrafts` and `onDiscardDrafts`. `@object-ui/i18n`: new `chatbot.changes.*` keys in every pack.
