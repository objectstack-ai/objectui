---
'@object-ui/plugin-kanban': patch
'@object-ui/i18n': patch
---

Kanban cards no longer tell screen-reader users to press the space bar. Each card's accessible description is now a sentence from the `kanban.dnd.instructions` bundle key, in the viewer's language, saying that a card moves to another column by dragging it with a pointer or by touch. The board has no keyboard drag, so the description names no key. The package README's "Accessible" line now says the same.
