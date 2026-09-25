---
'@object-ui/cli': patch
'@object-ui/types': patch
---

`objectui check`'s help line and six `@object-ui/types` comments no longer present `check` as a
validator (objectui#10524).

- `@object-ui/cli`: `objectui --help` and `objectui check --help` described `check` as
  "Validate schema files". It now reads "Advisory JSON file sweep; run objectui validate for a
  verdict". `check` itself is unchanged. It sweeps the project's JSON files and recognises a
  file whose root carries a structural key (`children`, `className`, `body`, …) by that key
  alone, without parsing it against the schema. It parses against the schema only a file with
  none of those keys, and lists it by name when its root `type` names a registered component but
  the document does not validate. That list is advisory: `check` exits non-zero on unreadable
  JSON only. The verdict is `objectui validate`'s: it parses one document against the published
  schema, prints the schema's own errors and exits non-zero.
- `@object-ui/types`: the `ChatbotSchema.body` docblock said the retired key's refusal comes from
  "a root parse (`objectui validate` / `objectui check`, …)". `body` is itself one of the
  structural keys, so `check` never parses a `chatbot` document that authors it against the
  schema. The docblock now names `objectui validate` alone and says why `check` does not deliver
  the refusal. The two
  `SemanticElementSchema` docblocks (the interface and its zod mirror) said a document was
  refused by `objectui check`; they now name `objectui validate`, whose refusal it was. The
  `ObjectGanttSchema.gantt` comments (the interface and its zod mirror) and the
  `ObjectCalendarSchema` `sort` comment in the zod mirror said the refusal reaches the CLI's
  `validate` / `check`; they now name `validate` alone.

A help string and comments only: no command's behaviour, export, type or schema moves.
