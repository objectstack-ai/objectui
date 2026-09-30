---
'@object-ui/plugin-form': patch
'@object-ui/i18n': patch
---

`WizardForm`'s own chrome now reads the locale packs (objectui#10999). The
default Cancel, Back, Next, Submitting, Create and Update labels, the
"Step x of y" counter, the step indicator's label for a step that declares no
`label`, the indicator's accessible name, and the notice on a step with no
fields were English literals, so a wizard in a zh session showed `Cancel`,
`Step 1 of 3` and `Next` beside a Chinese UI. They now resolve through the
wizard's existing `createSafeTranslation` hook, the way the rest of
plugin-form's chrome does.

An authored `cancelText`, `prevText`, `nextText` or `submitText` still renders
exactly as authored, in every locale: only the defaults are localized, and the
four keys stay plain strings.

Five of the strings reuse keys the packs already carried: `common.cancel`,
`common.next`, `form.create`, `form.update`, and `form.stepOf`, a key that
`pnpm check:i18n-dead-keys` listed as read by nothing until now. Five are new
under `wizard.` in all ten packs: `back`, `submitting`, `stepFallback`,
`progressLabel` and `emptyStep`. The wizard gets its own `back` rather than
`common.back` because zh words a wizard's step back ("previous step", the term
`grid.import.back` and `grid.bulk.back` already use) differently from a page's
back ("return").

The zh value of `form.stepOf` gains the spaces around its numbers that the zh
pack's other position counters, such as `table.pageInfo` and
`detail.recordOf`, already carry.

**One rendered English string changes**: the final button's in-flight label was
typed with three ASCII full stops and is now `Submitting…` with the typographic
ellipsis, because it is a pack value now and `ellipsis-glyph-3878.test.ts`
holds every pack value to U+2026. Every other English default renders the same
text as before.
