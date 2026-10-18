# 云控制面首页 · 只用通用区块 · 2026-10-18

One artboard (1280 × 900) for the cloud control plane's home, composed only from the generic blocks objectui#12197 delivers (`hero`, `tile-grid`, `stat`, `usage-bar`, `checklist`) plus `flex` / `element:text` / `element:button` / `element:repeater`, so `welcome.page.ts` in objectstack-ai/cloud can transcribe it without any React. Each block's name is printed as a small black tag at its top-left. All data is one `GET /api/v1/cloud/home` response (cloud#2783): environment name / hostname / status / lastPublishedAt / plan / storage / aiWeekUsedPercent / installedApps, members, entitlements, checklist.

`CloudHome.dc.html` is the canvas source (`{{accent}}` is the primary-colour token); `CloudHome.preview.html` opens in a browser.

Rulings (2026-10-18, the epic PM session, verbatim): 「只是利用现有的 objectui 区块，把这个页面写的好看一点不行吗」 and 「12197 需要的区块你决定就可以了啊」 — the block list on objectui#12197 (comment 6243756425) is the PM's, delegated by that sentence; the 2026-10-12 ruling (cloud pages stay metadata, objectui ships product-agnostic blocks) stands.
