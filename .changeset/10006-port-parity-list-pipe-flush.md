---
---

Tooling and tests only, no package released: `scripts/check-upstream-port-parity.mjs` no longer ends
on `process.exit(...)`. On POSIX, `process.stdout` is asynchronous when it is a pipe, and
`process.exit` discards whatever is still queued — so `--list`, which is nothing but a `console.log`
loop, reached a piped caller cut at a point that depended on runner load. The gate's own wiring test
captures it with `execFileSync`, so a lost line failed as `no listing line for ID under FILE`: a
specific and false claim about a file the branch under test had never touched. Four unrelated pull
requests were reddened that way, one of them ejected from the merge queue and one a comment-only
diff; the control is the same commit `0a4bf6deb`, no new commits and no rebase, going red then green
(objectui#10006).

The entrypoint now sets `process.exitCode` and lets Node exit once the streams drain. Every exit
code is unchanged, proven path by path — clean, drift, unreadable pin, structurally unusable pin,
uncaught throw, and all four `--resync` refusals plus its success path — and the stdout/stderr bytes
are identical too. The wiring test grows two pins: the listing reconciles against the count the gate
itself announces, so a short capture fails as "less arrived than was sent" rather than as a claim
about one divergence; and a synthetic pin drives a listing past what a pipe holds and requires the
piped capture to equal the same run's capture to a file.
