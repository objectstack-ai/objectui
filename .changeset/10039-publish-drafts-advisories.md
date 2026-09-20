---
'@object-ui/app-shell': patch
---

The AI build bar, the Studio workbench and the chat transcript's draft cards report the runtime authoring gate's per-draft advisories (objectui#10039)

`POST /packages/:id/publish-drafts` has answered `advisories` on each
`published[]` element since objectstack#9343 landed, and objectui#6965 built the
seam that reports them — `MetadataClient.publishPackageDrafts`, which emits one
advisory event per advised element into the sink, renderer and wording the save
and single-item publish doors use. Three app-shell call sites were still firing
that route with a bare `fetch`, so on those surfaces the findings were parsed by
nobody: `console/ai/PendingDraftsBar`, `views/studio-design/StudioDesignSurface`
and the chat draft card's publish handler in `console/ai/AiChatPage`. Each of the
three now takes its client from `useMetadataClient` and calls that method, which
is the whole change — the advisory toast is the client's, so all three surfaces
report identically to the two objectui#6965 routed, with no new UI shape.

What moves with the route, at all three:

- A non-2xx raises `MetadataError` inside the client instead of being read off
  `res.ok`. The message is still the server's own, and the ADR-0112
  producer-marked `error.userMessage` now outranks the diagnostic `error.message`
  where the refusal carries one — the rule objectui#7959 landed on `PackagesPage`,
  reaching these surfaces by the same seam rather than by a fourth copy.
  `StudioDesignSurface` keeps its field-anchored issue rendering: the client
  already carries `error.details.issues` on `MetadataError.issues`, which is what
  its `formatMetadataError` reads.
- `failed[]` / `failedCount` / `seedApplied` are read through ONE spelling. The
  client unwraps the dispatcher's `{ success, data }` for this route — the one
  route whose spec declaration says the body arrives inside one — so the two
  server compositions are reconciled before a caller sees them, where the bare
  `fetch` sites each carried their own `payload?.data?.x ?? payload?.x` ladder.
- The 2xx batch verdict stays each surface's own, unchanged: `success: false` is
  not a refusal on this route, and the three surfaces disagree on purpose about
  what a partial or rolled-back batch should say.
