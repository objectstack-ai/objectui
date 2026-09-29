---
'@object-ui/console': patch
---

The console bundle now carries `@objectstack/*` 17.5.0 and `zod` 4.6.5 (objectui#11073). `pnpm-lock.yaml` resolved `@objectstack/{spec,types,sdui-parser,lint,formula,core,client}` at 17.4.0. It now resolves them at 17.5.0, the `latest` on npm. `@objectstack/spec` 17.5.0 and `@objectstack/core` 17.5.0 require `zod ^4.6.1`, so objectui's own `zod ^4.4.3` resolves to the same 4.6.5: two zod minors do not type-check against each other.

No manifest range moves, and no `@object-ui/*` source API changes. The level is `patch` because the only published artifact whose bytes move is the `@object-ui/console` bundle, which inlines its `@objectstack/*` and `zod` devDependencies. Its client-side validation now answers as the published 17.5.0 contract does. Every narrowing in that contract is the spec's, and it already reaches any consumer that resolves `@objectstack/spec ^17`. The `@object-ui/types` changes in this PR are test pins re-read against 17.5.0 and one source comment; they carry no behaviour.
