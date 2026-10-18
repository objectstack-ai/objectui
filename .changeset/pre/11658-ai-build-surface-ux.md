---
'@object-ui/app-shell': patch
'@object-ui/plugin-chatbot': minor
'@object-ui/i18n': minor
---

Five fixes on the AI build surface, from the 2026-10-05 cloud acceptance run (objectui#11658).

- **The first AI build lands on the running app.** The built-moment transition still moves the conversation into the Studio workbench at `/studio/PKG/interfaces`. The Interfaces canvas now opens in **Run** mode with the properties panel collapsed, where it used to open in Design with the panel open. One click on **Design** brings back the design overlays and the properties panel. Every other way into Studio, the "Design in Studio" button included, still opens in Design. The transition asks for this with router state, which the pillar reads once at mount; it is not a URL param, so a reload or a shared link opens the designer.
- **The in-app composer names the task.** Inside an app, the composer placeholder reads "Ask about your data, or ask me to change this app…". This covers the console dock in a running app, the Studio dock and `/ai/build?package=`. It used to read "Ask {agent}…", which showed as「向 构建 提问…」in Chinese. The cold-start build surface and the ask agent keep the placeholders they had. New key: `console.ai.askOrChangeApp`.
- **The AI usage popover shows one figure.** The popover shows the share of the single AI pool used so far (`console.ai.usage.poolUsed`, for example "19% used"). It no longer shows the build / data-Q&A split, because that split cannot honestly say which part a single-composer turn used. The keys `console.ai.usage.meterBuild`, `meterAsk` and `breakdownTitle` are retired from all ten packs. `useAiUsage` still reads `breakdown` from the wire and validates it strictly, but nothing renders it.
- **The usage gauge no longer looks like a loading spinner.** The header glyph is now a closed outline in the tone colour with a pie wedge inside it. It used to be a stroked arc over a faint track, which at low usage had the outline of a spinner.
- **The plan card's scope chip is localized.** The extend-mode chip on the proposed-plan card and on the live design panel reads the pack's `chatbot.plan.extendTarget` sentence, where it used to show the English literal "Adding to existing app". It names the target app by its label, and the internal name moves to the chip's tooltip. `ChatbotEnhanced` gains an optional `resolveAppLabel(appName)` prop, and the console passes one over its metadata apps. A host `planExtendLabel` still takes precedence, but the prop no longer defaults to an English string.
