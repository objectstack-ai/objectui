---
'@object-ui/console': patch
'@object-ui/i18n': patch
'@object-ui/plugin-form': patch
---

fix(console,plugin-form,i18n): the public form page and the master-detail form chrome speak the user's language

objectui#11039 moved the form family's feedback chrome onto the locale packs and
left two halves behind, both still English inside a Chinese UI.

The console form page (`/f/:slug`, `/forms/:name`) rendered its action chrome from
literals: the submit button's `Submit`, its in-flight `Submitting…` and
`Uploading…`, the `Redirecting…` line of a pending redirect, and the frame of the
`Required: …` refusal. They now read `publicForm.submit`, `publicForm.submitting`,
`fields.file.uploading` (the key every other form's in-flight Save label already
reads), and two new keys, `publicForm.redirectPending` and
`publicForm.requiredFields`. The refusal is one key with a `{{fields}}` hole and
its labels are joined with the pack's own list separator, so the colon, its
spacing and the word order belong to the locale.

`plugin-form` had the same literals in the master-detail form: `Loading columns…`,
the `Subtotal` / `Tax (N%)` / `Total` stack, the row editor's `Line item — row N`
title with its `Apply` and `Close`, the in-form collection's `Add`, and the Save
button's `Saving…`; in `ModalForm`, the sr-only description of a master-detail
dialog; and in `ObjectForm`, the hint under a field the caller may read but not
write. They now read the pack (new keys under `form.masterDetail` and
`form.deniedDescription`, plus the existing `detail.add`, `detail.saving` and
`common.close`), in all ten packs.

Only defaults move. An authored value still wins everywhere it did: a collection
`title` and `addLabel`, a dialog `description`, a field `description`, an authored
field label inside the refusal. English output is byte-identical to the literals.
