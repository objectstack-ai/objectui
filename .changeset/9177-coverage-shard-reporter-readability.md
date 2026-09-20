---
---

Restore the failing-test names to a red coverage shard's job log (objectui#9177).
CI and test only; no package is released by this change.

`ci.yml`'s `test-coverage` legs ran `pnpm test:coverage --reporter=blob
--shard=N/4`. A CLI `--reporter` REPLACES the reporter set rather than adding to
it, and the set it replaced was exactly `default` plus — under
`GITHUB_ACTIONS=true` — `github-actions`. A red shard's log therefore ended at
`blob report written to …`, with no failing test name, no assertion text and no
timeout message, and the shard job's only annotation was the generic `Process
completed with exit code 1.` The failures survived solely inside the
`coverage-blob-N` artifact, which is download-only. objectui#8545 priced that:
two episodes in which one test file held `main`'s coverage gate unevaluated for
84 and 87 consecutive pushes, both found by a person reading a job log by hand,
days later.

The shard legs now pass `--reporter=blob --reporter=default
--reporter=github-actions`. Measured on vitest 4.1.10 under `--shard=N/4`: the
log carries `Failed Tests`, the test names, the assertion diff and `Error: Test
timed out in …`; `github-actions` emits one `::error` annotation per failing
test, which is the only form of this an API reader gets without downloading an
artifact.

Additive on purpose — the blob stays first and the threshold overrides are
untouched, because the merge job is what enforces the thresholds and it has
nothing to read without the blob (objectui#5403). Verified on the same four
blobs the new invocation writes: the merged report is produced and the
configured thresholds are still evaluated over it.

`scripts/__tests__/coverage-shard-reporter-readability.test.ts` pins both
directions — dropping the readable reporters restores objectui#9177, dropping
the blob trades an unreadable failure for an unevaluated coverage floor.
