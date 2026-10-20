---
---

No package released: test only. Two `@object-ui/app-shell` backfill tests now wait for the backfill checkbox's counted name instead of reading it synchronously: the Studio publish-backfill test's unchecked case (as its other two cases already did), and the pending-changes sheet's "one choice" case. The drill-in reads the record count after the option renders, so a synchronous read raced that count on a slow runner (objectui#13120). No source, export, type or behaviour changes.
