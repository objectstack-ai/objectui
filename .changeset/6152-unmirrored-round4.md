---
'@object-ui/types': minor
'@object-ui/components': minor
---

feat(types): four declared keys nothing honoured are retired on both faces, and two chatbot keys gain their zod mirror (objectui#6152, round 4)

**Retired (breaking).** Each key below was declared on a published TypeScript type in
`@object-ui/types` and unknown to its zod mirror in `@object-ui/types/zod`. None of them is
honoured, so each is retired at once, with no alias window:

- `label`: `content`, a third spelling of the label text beside `text` and `label`. The `label`
  renderer in `@object-ui/components` read it last (`text`, then `label`, then `content`) and no
  longer reads it, so a node that carries only `content` renders no text. No document in this
  repository authored it. Write `text` (or `label`).
- `report`: `chartConfig` and `reportType`. Nothing read either key off a report, so an authored
  value configured nothing. `specReportToPresentation` no longer writes `reportType` onto the
  presentation it returns, and `LegacyReportPresentationLike` no longer declares it.
- `detail-view`: `autoDiscoverRelated`. Nothing read it: `detail-view` does not discover related
  lists from reference fields. Author a `record:related_list` block for each related list.

For each retired key:

- the TypeScript member is now `?: never`, so writing it is a `tsc` error;
- the zod mirror refuses it by name at the key, on the tolerant validator (`AnyComponentSchema`,
  `safeValidateSchema`) and on the strict authoring face (`StrictAnyComponentSchema`) alike. The
  tolerant validator used to keep the value without examining it.

Delete the key from any document or literal that carries it.

**Mirrored.** Two chatbot keys the published types declare, and the renderers read, gain their
zod arm:

- `chatbot`: `requestBody`, the chat API's extra body params. All three chatbot nodes now share
  one `requestBody` arm. The strict authoring face used to refuse `requestBody` on a `chatbot`
  node, although the type invites it and the retirement of `body` points authors at it.
- `chatbot-floating`: `floatingConfig`, judged member by member (`position`, `defaultOpen`,
  `panelWidth`, `panelHeight`, `title`, `triggerSize`). Its retired `triggerIcon` member is now
  refused at runtime too, on this node. On a `chatbot` node `floatingConfig` stays unvalidated,
  because the `chatbot` renderer never reads it.

A wrong-typed value at either key, for example a string `requestBody` or a `floatingConfig`
`position` of `'top-left'`, is now refused at its path, where it used to be kept unexamined
(breaking for invalid documents).

`@object-ui/types` and `@object-ui/components` are in the fixed release group, so this ships as a
minor bump, per the repository's version policy.

`displayMode` on the two chatbot types is unchanged: its refusal stays TypeScript-only, so stored
designer documents that carry `displayMode: 'floating'` parse exactly as before.

**Correction, 2026-10-01 (objectui#6152, round 5).** The "Mirrored" section above says that on a `chatbot` node `floatingConfig` stays unvalidated. That was true when this change was written, and it no longer is: objectui#6152 round 5 retired `floatingConfig` on the `chatbot` type, so writing it on a `chatbot` node is now a `tsc` error and a parse error that names `chatbot-floating`. The `chatbot-floating` node keeps its `floatingConfig`, judged member by member, as this entry says.
