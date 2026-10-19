---
"@object-ui/plugin-chatbot": patch
---

The AI build plan card now draws a composed record title's line (for example 「名称：自动生成「{图书} · {读者} · {借出日期}」，表单里不出现」) in place of the plain 「名称：LABEL」 line, read from the plan card's `nameField.generated` key that objectstack-ai/cloud writes since cloud PR #3047. An object without the key draws as before.
