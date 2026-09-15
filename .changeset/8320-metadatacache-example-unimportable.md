---
---

Remove the `@example` from `MetadataCache`'s class docblock and say plainly that
the class is package-internal (objectui#8320). The block opened with a direct
construction of the class, which is a line no reader outside
`@object-ui/data-objectstack` can run: the package declares exactly one export
key (`.`), `ObjectStackAdapter` imports the class directly and keeps it in a
`private` field, and `import { MetadataCache } from '@object-ui/data-objectstack'`
is TS2305, `has no exported member`. The docblock now points at the route a
reader can actually take — `createObjectStackAdapter`'s `cache` option and the
adapter's `getCached` / `getCacheStats` / `invalidateCache` / `clearCache`.

Nothing is exported that was not exported before, and no package is released by
this change: the class is not part of any published entry, its docblock never
reached `dist/*.d.ts`, and all four published artifacts
(`dist/index.{js,cjs,d.ts,d.cts}`) rebuild byte-for-byte identical.
