---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Render the environment admin's read-rate report from the usage endpoint's `readRate`
reading (objectui#9954; maintainer ruling on cloud#2333, batch #164 item 3).

The tenant runtime's `GET /api/v1/usage/storage` gained one optional nested key,
`readRate`, carrying the control plane's verdict (`state`), the ratio it measured
(`readsPerWrite`) and the line that verdict was taken against (`ratioThreshold`). The
data half landed on the cloud side; nothing in this repo consumed it, so a measured
anomaly reached nobody. This is the rendering half.

**New:** `useReadRateReading` (a hook beside `useAiUsage`) and `ReadRateBanner` (a
layout surface beside `ImpersonationBanner`, mounted in `ConsoleShell` so every console
route including `/home` carries it). Both are exported from `@object-ui/app-shell`.

Three properties of the contract shape the implementation, and each is pinned by a test:

- **An absent `readRate` is not "fine".** It means the control plane reported NO
  reading. The hook reports it as `unmeasured`, which is a different value from a
  measured `ok` and from an unreadable endpoint. All three render nothing, and the code
  keeps all three apart — "why does my environment show no banner" has more than one
  answer and one of them is *nobody has measured it*.
- **An absent `readsPerWrite` is the worst case, not a missing number.** It means the
  environment made no writes at all, so the ratio has no upper bound. It gets its own
  title, its own sentence and the heavier tone — never a dash, and never a hidden
  banner.
- **The threshold is data.** It is rendered from `ratioThreshold` on the wire; this repo
  holds no copy of the line, and the verdict is never re-derived from the ratio.

It is a **report**: no gate, no throttle, no upgrade call to action, and the copy says in
as many words that nothing is limited or blocked. It is shown only to a workspace admin,
who is also the only session that issues the request.

`@object-ui/i18n` gains the four `console.readRate.*` keys in all ten locale packs.
