---
---

No package released: the `@objectstack/*` pin moves from `830a63a6805f` to objectstack `915e940499` (objectstack#25489), past `925fd0772c` (objectstack#24947, a bulk action's `confirmText` is a template slot over `count` and its params), and nothing objectui publishes changes behaviour (objectui#13407).

Only `.objectstack-sha` moves. The packed manifests in `.objectstack-pin/` and `pnpm-lock.yaml` are unchanged: the bump wrote byte-identical manifests, and `pnpm install` left the lockfile as it was. The pin stops before objectstack#25483 on purpose. The renderer already reads the `{ dialect: 'template', source }` envelope (objectui#13319), so the spec's widened `confirmText` type needs no source change here.
