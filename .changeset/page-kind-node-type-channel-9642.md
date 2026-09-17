---
---

Declare the page-kind to node-type channel (objectui#9642) — comments and one
pin test only, no published behaviour moves, so this declares "not shipping"
rather than a bump.

A stored page document's `type` field is the spec's page KIND, and the app-shell
page view writes it verbatim into the SchemaNode discriminator that the
component registry dispatches on. The page-kind registrations on `PageRenderer`
exist because of that line. Nothing said so at either place an auditor arrives,
so two cards read those registrations as "registered but never declared" and one
of them reached a draft PR that would have stopped every stored kind-`app` page
rendering. The channel is now stated at both reading ends and pinned by a test
that names it when it breaks.

Nothing authorable changes: no registration is added, removed or renamed, no
accept set moves, no name joins a published barrel, and the upstream page-kind
enum is read and never edited.
