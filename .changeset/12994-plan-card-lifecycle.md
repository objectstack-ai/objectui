---
'@object-ui/plugin-chatbot': patch
---

The AI build plan card draws a stage field's lifecycle on its chip (for example 「借出 · 已还 ✓完成 · 逾期 ⚠」), read from the plan card's `lifecycle` key. A chip without the key draws as before (objectui#12994).
