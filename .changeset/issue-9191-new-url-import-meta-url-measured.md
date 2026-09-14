---
---

`AGENTS.md` only — no released package source is touched, so this declares **no release** with
an empty frontmatter rather than a bump. A `patch` here would version-bump the whole fixed
package group for a change no consumer can observe.

objectui#9191: the test-path bullet declared the two-argument `new URL(…, import.meta.url)`
form fatal on a named mechanism — Vite rewriting it to an `http://localhost:3000/@fs/…` URL on
which `fileURLToPath` throws `ERR_INVALID_URL_SCHEME` under both cwds, taking the suite down.
Re-measured against every project `vitest.config.mts` declares (`unit` on node; `dom`,
`dom-heavy` and `dist` on happy-dom; the `apps/console` project with its full plugin set) under
both the repo-root and the package-directory invocation: it does not reproduce. `import.meta.url`
is a `file:` URL in each of them, the derived path resolves and the read succeeds.

The prescription is kept — one spelling only, the bare `import.meta.url` form PR objectui#7796
landed and objectui#7806 reused — but it now rests on spelling uniqueness rather than on a
hazard this tree does not exhibit. The bullet's ⚠️ is corrected in the same hunk: the
`process.cwd()` class it said nothing could stop is gated today by
`scripts/check-test-path-roots.mjs`, which deliberately does not flag this spelling.
