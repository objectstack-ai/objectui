---
---

Test-only change: `@object-ui/plugin-grid` records where the server's CSV import parse and the import wizard's own parse read a CSV file differently, measured before the wizard sends a CSV file source to the server's CSV import door (objectui#13315). The wizard still sends a CSV file's rows as JSON on its default path. No published behaviour changes.
