---
'@object-ui/plugin-chatbot': patch
---

`ChatbotEnhanced`'s `onDesignBuiltApp` doc comment now describes what the finished build card draws since objectui#12724: "Open app" (打开应用) is the primary action and "Design in Studio" (在 Studio 中查看) the secondary one, primary only when the host passes no `onOpenBuiltApp` (objectui#12842). It no longer cites an ADR section that does not exist. Comment only; no behaviour changes.

Clause-②: no
No prop, export or language-pack key moves.
