---
'@object-ui/types': minor
---

A public block's prop written directly on the node, instead of inside its `properties` bag, is refused by name on both faces, with a message naming `properties.KEY` (objectui#10872, batch 10).

**Clause-②: no.** The change only refuses: no document that was refused now parses, and nothing joins the public surface. The new helper is internal to the zod modules and not re-exported from `@object-ui/types/zod`.

**What it was.** Each public-block arm declares `properties` as the block's `@objectstack/spec` `ComponentPropsMap` row. The same member written on the node itself was not judged against that row. A key the node base (`BaseSchema`) does not declare, such as `{ "type": "record:details", "columns": "2" }`, passed `safeValidateSchema`, and so `objectui validate`, unjudged, and the strict authoring face refused it only as an unnamed `unrecognized_keys`. A key the base does declare (`visible`, `disabled`, `name`, `description`, `data`) passed both faces against the base's own type. `@objectstack/spec`'s own page component refuses every one of them as mis-layered (ADR-0089 D3a), so `objectui validate` accepted documents `os validate` refuses.

**What changed, in observable terms.**

- On the 26 public-block arms whose row declares a member, and on `object-metric`, `object-master-detail-form` and `object-timeline`, each member of the row written on the node is refused by `safeValidateSchema` and by `StrictAnyComponentSchema`, with `invalid_type` at that key's own path. The message reads "Did you mean `KEY` → `properties.KEY`?" and shows the bag spelling. This applies at every depth the faces judge, so a flat key on a child node is refused at the child's path.
- Write the block's props in the bag instead, as `AGENTS.md` #4 teaches: `{ "type": "action:button", "properties": { "label": "Open details", "actionType": "url", "target": "/users/ada" } }`.
- Two kinds of row member are left as they were. A member `@objectstack/spec`'s page component also declares on the node itself, such as `label` or `aria`, keeps its node-level meaning. A member the row itself retires (`page:header`'s `icon`, `page:card`'s `actions`, `record:details`' `layout`) keeps the row's own retirement message when written flat, instead of pointing at a bag member that is refused too.
- An arm's own refusal of a row key keeps its message: `record:alert`'s flat `body`, the `onSuccess` of `action:button` and `action:icon`, and the content-channel refusals.
- A key that is in neither the row nor `BaseSchema` stays as before: unjudged by the tolerant face, refused by the strict face.

**What does not change.** Nothing at render time. `SchemaRenderer` still reads both spellings: it hoists each `properties` key onto the node before the renderer runs. So stored documents keep rendering, and so do nodes built in code, such as an action bar's menu, a dashboard's metric tile and a form's master-detail node, none of which passes through these faces. The `element:*` renderers read only the bag, so a flat key there never reached the block; the refusal now says so when the document is written instead of rendering nothing.

**Across the release.** None of these arms has shipped yet: `@object-ui/types` 17.6.0 has no public-block arm, and its `safeValidateSchema` refuses all of these types at `type`. So for a published consumer the accept set only widens; this narrows what earlier entries of this same release accept.

**Docs.** The two teaching sites left in the flat spelling after objectui#11183 now write the bag: the `record:related_list` actions example in the slotted-pages guide, and the two `action:button` route examples in `@object-ui/app-shell`'s README.
