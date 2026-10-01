---
'@object-ui/types': minor
'@object-ui/fields': patch
---

Declare the two consumed-but-undeclared field-metadata keys ruled on
objectui#6140 / objectui#6153 (maintainer 2026-08-25, Option A), and de-cast
the widget reads they legalize:

- `MarkdownFieldMetadata.rows` and `HtmlFieldMetadata.rows` (`@object-ui/types`)
  — the inline-editor height `RichTextField` has always read through an
  `as any` (default 8), following the `TextareaFieldMetadata` precedent. NOT a
  spec key: `@objectstack/spec` `FieldSchema` refuses `rows` BY NAME
  (`unrecognized_keys`) on all four of textarea/markdown/html/richtext, so it is
  an objectui render hint that must not be written into authored object
  metadata. The four inert editor keys (`toolbar`/`preview`/`minHeight`/
  `maxHeight`) stay deliberately undeclared and are pinned so.
- `SelectOptionMetadata.description` — secondary option text `LookupField`
  searches on authored static options and emits from `recordToOption`. NOT a
  spec key either: `@objectstack/spec` `SelectOptionSchema` is strict over
  exactly `{label, value, color, default, visibleWhen}` and refuses
  `description` BY NAME, and `FieldSchema` routes `options` through that schema,
  so the key must never reach authored object metadata.
- `RichTextField` and `TextAreaField` (`@object-ui/fields`) now read their
  metadata through the declared types instead of `field as any` (the spec-face
  `maxLength` dual-read in `TextAreaField` stays as a documented structural
  read). Behaviour unchanged; `rows` and option `description` are now legal to
  author in an objectui **annotated literal** — never in an object document sent
  to the platform.

Both spec attributions above were corrected in place before release
(objectui#7537): as first written this changeset claimed each key was "aligned
with" a `@objectstack/spec` schema member that does not exist. Re-measured on
`@objectstack/spec@17.2.0`, each refusal is paired with a control that accepts
the same payload minus the key. Same correction as `0e3b3be09` (PR #7510) made
to the published JSDoc; the package bumps and the declared behaviour are
unchanged.

⚠️ **Dated note, 2026-09-27 — the spec has since declared both keys, so neither
refusal above holds — objectui#10801.** `@objectstack/spec` 17.3.0 declared
`rows` and option `description` (the objectui#6140 / objectui#6153 ruling), and
this repository resolves 17.4.0 on this date. Measured on 17.2.0, 17.3.0 and
17.4.0, each probe beside a control that differs only by the key: 17.2.0 refuses
both by name, as above. From 17.3.0 `SelectOptionSchema` declares
`description`, so an option carrying it is accepted and a select field or an
object whose `options` carry it parses whole; `icon` is still refused by name
(`unrecognized_keys`). From 17.3.0 `FieldSchema` accepts `rows` on the four
multiline editor types (`textarea`, `markdown`, `html`, `richtext`); on 17.4.0
every other field type refuses it by a cross-field refinement (issue code
`custom` at `rows`), not by name. So the sentences above that call these keys
"NOT a spec key" and keep them out of an object document sent to the platform
no longer describe the contract: both may be authored there, `rows` on those
four types only. The rest of this entry, and the 17.2.0 correction above, are
kept as the reading of this change; `select-option-spec-extension-7014.test.ts`
in `@object-ui/types` re-derives both boundaries against the installed spec.

⚠️ **Dated note, 2026-09-30 — `TextAreaField`'s dual read is retired — objectui#11070.** "the spec-face `maxLength` dual-read in `TextAreaField` stays as a documented structural read" above no longer describes what ships. Later in this same release objectui#11070 (its text-family round) declared `maxLength` on `TextareaFieldMetadata` by reference to `@objectstack/spec`'s `FieldSchema.maxLength`, and `TextAreaField` reads it through that declared type, alone; the snake_case `max_length` is retired. `.changeset/11070-text-family-round5.md` states what ships; the text above is kept as the reading of this change.
