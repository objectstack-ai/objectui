---
'@object-ui/plugin-chatbot': minor
'@object-ui/app-shell': patch
---

The AI build chat's pending-drafts bar no longer covers the composer's input (objectui#12978).

On the full-page chat (`/ai/build`), with a pending draft, the bar that offers 发布 floated over the composer (`absolute bottom-20`): it sat on the input's first line, so the placeholder and the first line typed were hidden. It is now a row of the composer's own area, laid out in flow directly above the input, so the conversation gives up the room instead, at every width. The console dock mounts the same chat pane and gets the same row. The package's own Studio still draws no bar (objectui#12965).

**`ChatbotEnhanced` gains `promptHeaderSlot`** (optional `ReactNode`): a host's row rendered in flow at the top of the prompt area, above the input and outside its form. Unlike `promptOverlaySlot`, which stays absolute-positioned for palettes, it takes layout space. Content that renders nothing takes no space. Hosts that do not pass it render exactly as before.

**Clause-②: yes (widening)**: one optional prop, `promptHeaderSlot`, added to `ChatbotEnhancedProps` in `@object-ui/plugin-chatbot`. No export is added or removed, and no existing prop changes.
