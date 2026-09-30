---
---

Test-only change in `@object-ui/types`; no published behaviour changes. objectstack#20357 retired the list view's own `tabs` as a tombstone whose input type is `never`, so the `p1-spec-alignment` fixture "should accept tabs configuration" stopped compiling on the Spec Main Shape Gate. The fixture is retired, and a fixture for the protocol's prescription takes its place: each tab becomes a named `listViews` entry, and `defaultListView` names the one `isDefault` picked. It compiles against both the installed `@objectstack/spec` 17.4.0 and spec `main` (objectui#10987).
