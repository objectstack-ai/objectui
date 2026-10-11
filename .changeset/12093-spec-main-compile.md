---
---

No release. objectui#12093 makes objectui compile against `@objectstack/spec` built from objectstack `main` (the Spec Main Shape Gate) while it keeps compiling, unchanged, against the installed release. The edits are tests, plus two type-only source edits with no runtime effect: `@object-ui/plugin-view`'s `ObjectView` reads the deprecated `table.defaultFilters` through a typed legacy read (the same value, read the same way, now typed by the rule-array shape legacy metadata carries rather than by the row's declaration, a retired-key tombstone on objectstack `main`), and `@object-ui/app-shell`'s zh-CN overlay-scope label table keys `org` beside the spec's union (objectstack `main` narrows that union to `env`).
