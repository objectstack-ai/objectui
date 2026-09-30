---
'@object-ui/app-shell': minor
---

The metadata-admin `SchemaForm` no longer crashes on a form section that references a field group, and the form-section authoring type accepts that shape (objectui#8725).

**Clause-②: yes** — two exported types change shape. `FormSectionSpec.fields` becomes optional, which widens what an author may write to match `@objectstack/spec`. `RichMetadataTypeEntry.form` narrows from `Record<string, unknown>` to `FormViewSpec`.

**BREAKING (types).** A consumer that reads `section.fields` unguarded, or indexes `FormSectionSpec['fields'][number]`, no longer compiles (`TS18048` / `TS2537`), because a `{ group }` section carries no `fields`. Read the element type through `NonNullable`. Do not default the list with `?? []`: a `{ group }` section then renders as a silently empty one. A consumer that treated `RichMetadataTypeEntry.form` as an open record now gets the `FormViewSpec` keys only. Outside `SchemaForm`, whose three reads are what this change fixes, no published source in this repository had to change. The other readers that changed were tests: two type-level pins, one in this package and one in `apps/console` (`FormPage.fieldSpec.test.ts`), and four `mergeServerFields` assertions.

**What was wrong.** `@objectstack/spec` lets a form section declare its members one of two ways: enumerate `fields`, or point `group` at a declared field group. The `/meta/types` registry hands its form document to `SchemaForm` without validation, and a `{ group }` section reached the renderer's first `fields` read. That read threw `TypeError: s.fields is not iterable` out of the component body and blanked the whole form, well-formed sections included, on both the simple and the tabbed layout. The required `fields` on `FormSectionSpec` only stopped a TypeScript author from writing the shape; the server channel carried it anyway, through an `as any` cast.

**What changed, in observable terms.**

- Every read of a section's `fields` in `SchemaForm` now sees a resolved section. A `{ group }` section goes through `@object-ui/plugin-form`'s `resolveSectionGroupReferences`, the resolver `ObjectForm` and the console `FormPage` already use, so `SchemaForm` gives their answer.
- No `SchemaForm` host carries an object definition, and `/meta/types` declares no field groups for a metadata type. So a `{ group }` section in a metadata-type editor names no declared field group. For that case the resolver renders the section empty and reports the dangling key once on `console.error`, naming the group and the form's `schemaId`. The other sections render normally.
- A section that declares neither `fields` nor `group` is still refused out loud. The render throws a `TypeError` that names the section; it does not draw an empty section.
- `RichMetadataTypeEntry.form` is typed `FormViewSpec`, and the `as any` casts where `ResourceEditPage` and `EmbeddedItemEditor` hand it to `SchemaForm` are gone.

No change for any form none of whose sections carries a `group` key: the resolver returns such a list by identity. A section carrying both `fields` and `group`, a shape `@objectstack/spec` refuses at parse, now takes the resolver's answer for its `group` (in a metadata-type editor, an empty section and the same `console.error`) instead of rendering its enumerated `fields`.
