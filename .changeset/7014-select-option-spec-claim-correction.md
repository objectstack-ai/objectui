---
'@object-ui/types': patch
---

Correct three false `@objectstack/spec` alignment claims on field metadata, and pin the
real boundary (objectui#7014).

**No contract change.** No type, schema, export or runtime path moves. What changes is
published JSDoc — the text that reaches your editor tooltips through `.d.ts` — which was
asserting the opposite of what the spec does.

⚠️ **The boundary this entry describes has since MOVED, and this paragraph is the
correction.** `@objectstack/spec` 17.3.0 declared both keys — the maintainer's 2026-08-25
Option-A ruling on objectui#6140 / objectui#6153 — and this repo's pin has moved past it.
Everything below was measured correctly against 17.2.0 and is kept as the dated record of
why the comments were rewritten; ⛔ do not read it as the contract you are authoring
against today. `rows` and `options[].description` are **authorable now**, and the doc
comments were corrected again in objectui#7635, which releases alongside this entry.

Three doc comments claimed the installed `@objectstack/spec` DECLARES a key that it in
fact **refused by name**. Measured on `@objectstack/spec@17.2.0`, each paired with a
control that accepts the same payload minus the key:

- `SelectOptionMetadata.description` said it "Aligns `@objectstack/spec`
  `SelectOptionSchema.description`". At 17.2.0 that schema was `.strict()` over exactly
  `{label, value, color, default, visibleWhen}` and `description` failed with
  `unrecognized_keys`. (17.3.0 added it — the comment was right about the destination and
  wrong about the date.)
- `MarkdownFieldMetadata.rows` and `HtmlFieldMetadata.rows` said `@objectstack/spec`
  `FieldSchema.rows` declares the key "authorable on exactly the multiline editor
  types". At 17.2.0 `FieldSchema` refused `rows` by name on all four of
  textarea/markdown/html/richtext. (17.3.0 declares it for exactly those four, so this
  claim too was early rather than wrong.)

The keys themselves stay declared and stay consumed — `LookupField` searches an option's
`description` (objectui#6153) and `RichTextField` reads `rows` (objectui#6140). Only the
attribution was wrong, and at 17.2.0 it mattered in a specific way: `FieldSchema` routed a
select field's `options` through the strict option schema, so authoring `description` on
an option made `PUT /api/v1/meta/object/:name` fail the **whole field** with a 422
`INVALID_METADATA`. The comments were inviting exactly that write, so they were rewritten
to call these objectui-side read-model extensions. ⚠️ That rewrite is what 17.3.0
falsified: the write now SUCCEEDS on both keys, and the comments no longer say otherwise.

A pin (`select-option-spec-extension-7014.test.ts`) asserts the option key set and each
by-name refusal, so that an adoption re-opens the claim loudly instead of silently making
it true. ⭐ That is exactly what happened — the pin was re-pointed to the 17.3.0 boundary
when the spec adopted both names, and it is why this entry could be corrected before it
shipped rather than after. The keys still outside the option vocabulary, and still the
live half of that pin, are `icon` and `disabled`.
