---
'@object-ui/types': minor
---

`UndoRedoEntry`, `UndoRedoConfig` and `UndoRedoState` are retired from this package (objectui#6349, batch 5). Nothing in the repository read or wrote any of the three, `@objectstack/spec` declares no such shape, and no runtime produced or consumed it — a published protocol type the runtime never honoured. `UndoRedoState` was also declared, with an unrelated meaning, by `@object-ui/plugin-designer`'s `useUndoRedo` hook; that hook result is now the one declaration of the name.

**Type changes, breaking for some consumers.**

- `UndoRedoEntry`, `UndoRedoConfig` and `UndoRedoState` are no longer exported. An import of any of them is now a compile error. There is no replacement in this package; an undo/redo history in a designer surface is `useUndoRedo`'s result in `@object-ui/plugin-designer`.

A doc comment beside `ChatToolInvocation` now names `@object-ui/plugin-chatbot`'s `ChatbotEnhancedToolInvocation`, the runtime declaration's new name; `ChatMessage` and `ChatToolInvocation` themselves are unchanged.

No runtime behaviour changes.
