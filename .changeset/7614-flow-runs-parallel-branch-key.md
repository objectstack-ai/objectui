---
'@object-ui/app-shell': minor
---

The Studio flow Runs panel now groups and labels parallel-branch steps by the branch they ran in, and names the loop row as well when the parallel node sits inside a loop (objectui#7614).

`@objectstack/spec` gave the branch index its own key on a run step, `branch`, and made `iteration` mean one thing only: the row of the enclosing loop (objectstack#14414). The panel still grouped parallel-branch steps by `iteration`. Against an engine that writes `branch`, that merged every branch of a parallel node into one "Branch" header, and inside a loop it numbered the header by the row instead of the branch.

- A parallel-branch step now groups on `branch`, plus `iteration` when the step carries one. Its header reads "Branch 2", or "Branch 2 · Iteration 3" inside a loop.
- Runs recorded by an engine that predates `branch` still read as before. Such a step is a parallel-branch step with no `branch` key; its `iteration` holds the branch index, and the panel reads it that way. It is never read as a loop row and never defaulted to branch 0.
- Loop-body and try/catch steps group exactly as before.
