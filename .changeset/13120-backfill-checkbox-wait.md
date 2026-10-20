---
---

No package released: test only. `@object-ui/app-shell`'s Studio publish-backfill test now waits for the backfill checkbox's counted name in its unchecked case, as its other two cases already did. The drill-in reads the record count after the option renders, so a synchronous read raced that count on a slow runner (objectui#13120). No source, export, type or behaviour changes.
