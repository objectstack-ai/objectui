---
'@object-ui/data-objectstack': patch
---

Read the flat REST error envelope in `ObjectStackAdapter`, so a denial that names the
missing grant stops arriving as a bare HTTP status word (objectui#9594).

A console operator who clicked "export to CSV" without the `allowExport` grant was
shown one word: `Forbidden`. The server had answered a full sentence — which object,
which user, which axis — and the adapter threw it away.

**Why it was thrown away.** `exportDownload` read its failure through a ladder that
knew two envelope dialects: the ADR-0112 nested `error: { message }`, and the flat shape
that carries a `message` key. The REST export gate writes a third one — flat, with the
sentence in a bare string `error` and no `message` key anywhere — so every rung missed
and the ladder fell through to `res.statusText`. The same ladder had been hand-copied at
four sites in the module (`searchAll`, `rawFindWithPopulate`, `exportDownload`,
`fetchObjectSchemaFresh`), and the two upload paths (`uploadFile`, `uploadFiles`) read a
narrower version of it, so all six were blind to the same dialect.

**The fix is one reader, not six patches.** A single internal `readErrorEnvelope` now
holds the dialect knowledge and every one of those six sites routes through it. It is
deliberately **not** exported from the package entry point — the published face of
`@object-ui/data-objectstack` is unchanged by this release.

**The rung order is load-bearing.** `message` is consulted before a string-valued
`error`, because the REST 401 body is flat *and* carries both keys, with the code word in
`error` and the sentence in `message`. Reading `error` first would make an
unauthenticated response render the word `UNAUTHENTICATED` instead of its sentence. The
401/403 pair is pinned as a control for exactly that inversion.

**The machine code now reaches the caller too.** The four `res.ok` ladders attach the
server's `code` to the thrown error (`EXPORT_NOT_PERMITTED`, `PERMISSION_DENIED`, …), so
a surface has something to discriminate on and an operator has something to search for.
`rawFindWithPopulate` already did this; the other three now match it rather than drifting
from it. The code is read from `code` or a nested `error.code` and **never** promoted out
of a string `error` — a sentence is not a code, and `@objectstack/core`'s own guidance
names that chain as where an envelope regression hides. The upload paths keep their
declared `UPLOAD_ERROR` code and their own fallback text; only the dialect reading is
shared, because their envelope is genuinely a different shape.

**Not a lenient fallback.** ADR-0112's 2026-07-30 amendment records the flat and the
wrapped envelopes as the two live, sanctioned shapes, and D5 leaves the flat one's
permanent position an open maintainer question. Every site routed through the reader calls
a `/data` route, whose declared answer is the flat family, so reading it is conformance
rather than tolerance. The server envelope is untouched — that belongs to the producer's
ratchet card in the `objectstack` repo.

**Blast radius.** Not one route: the REST package answers a wide family of these
`{ code, error }` bodies, and `VALIDATION_ERROR` / `PERMISSION_DENIED` / `INVALID_FILTER`
arriving as `Bad Request` / `Forbidden` is the same loss with a much wider audience than
the export button. The affected-code count quoted on objectui#9594 is a reading taken
against one published `@objectstack/rest` version by the scan that card records; nothing
in this repo re-derives it, so it is not restated here as a live figure.
