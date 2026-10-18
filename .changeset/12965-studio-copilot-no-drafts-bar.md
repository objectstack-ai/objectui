---
'@object-ui/app-shell': patch
---

The Studio copilot no longer draws the floating pending-changes bar over its composer (objectui#12965, part of objectui#12725).

With the build agent and a change pending, the chat's floating bar (「有 1 项改动尚未发布… 发布」) sat over the copilot composer's input line in Studio's right slot, at 1010 and at 1280 px wide, and hid the placeholder and the first typed line. In the package's own Studio the chat no longer draws it: the top bar's 变更 count and 发布, and the saved-draft card's 查看变更并发布, are the ways to review and publish there. The full-page chat and the console dock keep the bar as it was.

Clause-②: no. No export, prop, spec key or language-pack key changes.
