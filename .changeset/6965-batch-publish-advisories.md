---
'@object-ui/data-objectstack': minor
'@object-ui/app-shell': minor
---

Studio's "publish whole app" reports the runtime authoring gate's per-draft
advisories (objectui#6965; server half objectstack#9343).

`POST /packages/:id/publish-drafts` began answering `advisories` on each
`published[]` element when objectstack#9343 landed, but the author publishing a
whole app was still told nothing: both client call sites bypassed the data-layer
seam — a bare `fetch` in `usePublishAllDrafts` and the page-private `apiJson` in
`PackagesPage`, whose declared response type held two counts and `failed[]`, with
no `published[]` at all. The same button's own client-side capability lint was
raising a toast the whole time, so a finding from the server was the one thing
that could not reach the person pressing it.

- `MetadataClient.publishPackageDrafts(packageId)` expresses the route and emits
  one advisory event per advised `published[]` element — each naming that
  element's own `type` / `name` — into the sink, event and renderer the save and
  single-item publish doors already use. Both call sites go through it.
- The batch door reports `door: 'publish'` rather than a third discriminator
  value: every item the event names really was published, and the renderer's
  only door-dependent output is that verb. The per-item identity the author
  needs rides `type` / `name`, one event per item.
- It renders only what the server sent where `PublishPackageDraftsResponseSchema`
  declares it. A half-shaped finding, an element that cannot name its item, and a
  top-level `advisories` the ruled shape does not put there all report nothing —
  pinned, alongside the presence, in `metadata-client.publishAdvisories.test.ts`,
  whose absence pin this flips.
- `publishPackageDrafts` returns the batch body derived from the spec schema, so
  a caller reading `failed[]` / `publishedCount` reads a declared shape. Non-2xx
  raises the usual `MetadataError`; the 2xx batch verdict stays the caller's to
  judge, because `success: false` is not a refusal on this route.
