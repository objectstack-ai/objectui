---
'@object-ui/app-shell': patch
---

The console's pending-approvals read now asks for one page of requests and takes the count from the route's `total` (objectui#13027).

The bell badge, the approvals count in the inbox popover and Home's approvals count all come from one `GET /api/v1/approvals/requests` read. Until now that read was unpaged, so every console open pulled up to 500 enriched requests just to count them. It now sends `limit=5` and reads the response's `total`, the route's exact count. Home's approvals column lists the rows on that page.

It is still one request for every surface, so the bell and Home cannot show different numbers. The count is no longer capped at the old 500-row window. A deployment without an approvals service answers an empty page with no `total`, and that still reads as zero. A page of rows with no `total` is shown as a failed read. It is never reported as its own length.

Nothing is added to the package entry.
