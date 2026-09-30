---
'@object-ui/data-objectstack': minor
---

`aggregate()` reads the analytics answer in ONE spelling: `rows` on the `AnalyticsResult` that `client.analytics.query` resolves to (objectui#7028). The `{ success, data: { rows } }` envelope is no longer accepted at this site.

`@objectstack/client` 17.3.0 converged `analytics.query` on `unwrapResponse` (objectstack#13079): the method resolves to the payload, and the caller reads `result.rows`. The maintainer's ruling on that card ordered this adapter's tolerant row ladder tightened in the same wave. The ladder read five spellings (a bare array, `rows`, `data` as an array, `data.data.rows` and `results`) and answered any other shape with `[]`, which a chart renders as "no data" and a KPI as a confident zero.

What changes:

- **Only `rows` is read.** Any other value now throws the new `AnalyticsResultShapeError` (`code: 'ANALYTICS_RESULT_SHAPE_INVALID'`, with `envelope: true` when the value is the pre-17.3.0 envelope). It is not answered by the client-side `find()` fallback, because analytics did answer: degrading would put plausible numbers from a different code path over a contract violation.
- **Minimum version: `@objectstack/client` 17.3.0.** The dependency range moves from `^17.0.0` to `^17.3.0`, the first release that unwraps this method. A client older than that resolved `analytics.query` to the whole envelope, which this site no longer reads. The console's own `@objectstack/client` range moves with it, so the workspace declares one client floor.
- **No server is dropped.** The envelope has only ever been a client-side question: every `@objectstack` 17.x server answers `POST /analytics/query` with the same `{ success, data }` envelope, and the client decides whether it is unwrapped. The server version is not the variable here.
- The measure-missing fallback is unchanged: rows that come back without the requested measure are still re-aggregated client-side from a scoped `find()`.

The objectui#7122 changeset recorded these branches as kept "rather than deleted" and left the compatibility question open. The objectstack#13079 ruling answers it, and this change removes them.
