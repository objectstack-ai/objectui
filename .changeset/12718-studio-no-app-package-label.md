---
'@object-ui/app-shell': patch
---

Studio Interfaces names a package that has no app yet by its display name, the one the top bar prints, instead of its id (objectui#12718). The rail heading read `com.qa.recheck · Navigation` and the pillar title `com.qa.recheck` beside a top bar reading `QA Recheck`; both now read `QA Recheck`. The name comes from the package list the Studio surface already reads for its read-only gate, so no request is added. A package whose manifest declares no name still reads as its id, the only name it has.

A draft-only app (created, never published) is now named by the label its pending-draft row serves, as the shell header already names it, instead of its machine name. A published app keeps its own label.

Clause-②: no
No export, type member, spec key or language-pack key is added or removed. `InterfacesPillar` gains an internal `packageLabel` prop; it is not exported from the package entry.
