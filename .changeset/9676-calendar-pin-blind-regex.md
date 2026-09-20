---
---

Test-only change; nothing published moves. The `object-calendar` annotation pin
in `@object-ui/types` (`object-calendar-record-source-7313.test.ts`) stated a
total property over the plugin-calendar documentation page while asserting it
with a column-0-anchored, discriminant-first regex, so most of the class it
named could not make it fail. The row now enumerates that page's `const` object
literals and classifies each one by two independent signals, and a second row
feeds both previously blind shapes through that reading, so its ability to fail
is measured rather than asserted. The published surface is unchanged: this
package publishes `dist`, and the symbols this change adds live only in
`src/__tests__` — `node scripts/check-changeset-presence.mjs` is the instrument
that re-derives which files a release covers. Part of objectui#9676.
