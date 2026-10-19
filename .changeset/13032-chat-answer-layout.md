---
'@object-ui/plugin-chatbot': patch
'@object-ui/i18n': patch
---

An assistant answer reads well in the narrow assistant panel (objectui#13032). Headings inside a chat answer render at chat size (15–16px, bold, set apart by weight and spacing instead of the article-page 20–30px scale). Tables use 13px text and keep their first column frozen while the other columns scroll, and when the columns overflow the panel the table's expand control becomes a labelled, clearly visible "Expand" button. A finished answer taller than two heights of the conversation viewport is folded, with "Show full answer" and "Collapse" controls; an answer is never folded while it is still streaming. The scroll-to-bottom button now sits in its own row below the message list instead of floating over it, so it never covers text, a table or a heading. The four new strings ship in all ten locale packs.
