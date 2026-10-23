---
---

CI-only change to the aggregate `Test` gate (`scripts/check-test-shard-results.mjs`): a shard the Actions jobs API serves without a conclusion is also read from its own check run, and the gate reads its own job's check run once per run (objectui#13327). No published package changes.
