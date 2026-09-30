---
---

No release. objectui#3906 moves the PageHeader docs page, its catalog demo and that demo's pins to the canonical `page:header` node. The only file under a released package it touches is a test, `@object-ui/types`' `page-actions-refusal-7926.test.ts`, whose guide-reading control now looks for the header's action-id channel on `page:header` instead of the `page-header` alias; no published behaviour changes.
