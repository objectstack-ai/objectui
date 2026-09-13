---
'@object-ui/types': minor
---

Declare the two handler keys the `'detail'` renderer reads (objectui#7804, the
`plugin-detail` slice; director seat, decision batch #69, 2026-09-07).

`DetailSchema` — the zod arm `type: 'detail'` selects — now declares
`onNavigate` and `onAddComment` as objectui#6124 RUNTIME SLOTS: a named refusal
on the JSON face, a callable twin on the TypeScript face.

**Breaking, and measured.** `BaseSchemaCore` ends `.passthrough()`, so a key an
arm does not declare is not refused — it stops being judged and the value is
KEPT. Both keys were declared on NEITHER face while `DetailView` read and RAN
them. Measured on the unmodified arm:

- `{ "type": "detail", "onNavigate": { "action": "toast" } }` parsed GREEN, with
  `{"action":"toast"}` surviving into the parsed output; clicking Back then
  reported `TypeError: schema.onNavigate is not a function`.
- the same document spelling `onAddComment` parsed GREEN the same way, and the
  value was forwarded into the comment composer that awaits it.
- `onBack` — already a named refusal on the same arm — was refused on the same
  document, which is the control proving the probe could see a refusal.

After this change both keys are refused BY NAME with the objectui#6124 guidance
(issue `code: 'custom'` at the key's own path) and the message points at the
node-type spelling. A version shipped as `minor` because this repo's 41-package
`fixed` group makes `major` unavailable (`scripts/check-changeset-no-major.mjs`);
the accept-set move is the breaking part.

**Migration.** Nothing in the corpus has to change: no authored `'detail'`
document in this repository, its examples or its docs writes either key — they
were only ever reachable as host-supplied functions. A React host keeps
supplying them exactly as before, through the TypeScript interface, which now
declares the signature the call site builds (`onNavigate(url, { replace })`,
`onAddComment(text)`) instead of leaving it to `BaseSchema`'s `any`-valued index
signature. A document that *did* author either key was never running anything:
it was being handed an object where a function was expected.

Per key, not per prefix: the two reach the renderer on different channels —
`onNavigate` is called in `DetailView`'s own body, `onAddComment` is forwarded
as a prop into the comment composer — and both were driven through the real
`SchemaRenderer` before the disposition was assigned.
