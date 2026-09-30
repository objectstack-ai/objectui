---
'@object-ui/plugin-form': patch
'@object-ui/i18n': patch
'@object-ui/console': patch
---

The form family's own feedback chrome now reads the locale packs (objectui#11039). The default success toast, the thank-you heading, the loading line, the load-failure heading and the default submit and cancel labels were English literals, so a zh session saw `Created`, `Thanks!`, `Loading form...` and `Error loading form` beside a Chinese UI. They now resolve through the i18n catalogue, the way `WizardForm`'s footer has since objectui#10999.

**What moved.**

- `@object-ui/plugin-form`, across the presentations `object-form` routes to:
  - The success toast when no `successMessage` is authored: `form.created` after a create, `form.saved` after an edit (the default arm and `WizardForm`), and `MasterDetailForm`'s built-in save toast, whose "… saved" after an authored `title` is `form.savedNamed`.
  - The note that rides that toast when a declared `navigateOnSuccess` was refused: `form.navigateRefused`. The submitter reads it, as the toast's description.
  - The thank-you heading when a `thank-you` submit behaviour declares no `title` (the default arm and `WizardForm`): `publicForm.thankYouTitle`.
  - The loading line of the default arm, `TabbedForm`, `SplitForm`, `WizardForm` and `DrawerForm`: `publicForm.loading`.
  - The heading of the load-failure panel in those five and `ModalForm`: `form.errorLoading`.
  - The default submit label, `form.create` or `form.update`, in the default arm, `TabbedForm`, `SplitForm`, `DrawerForm` and `ModalForm`; the default Cancel of `DrawerForm` and `ModalForm`, `common.cancel`; and `MasterDetailForm`'s default Save, Create and Cancel, `common.save`, `form.create` and `common.cancel`.
- `@object-ui/console`: the form page (`/f/:slug` and `/forms/:name`) reads its loading line from `common.loading`, its success toast from `form.submitted`, and its default thank-you heading and message from `publicForm.thankYouTitle` and `publicForm.thankYouMessage`, through the `I18nProvider` that `main.tsx` mounts above every console route.
- `@object-ui/i18n`: six keys are new under `form.` in all ten packs: `created`, `saved`, `savedNamed` (`{{title}}`), `submitted`, `errorLoading` and `navigateRefused`. The three `publicForm.` keys were already in all ten packs with nothing reading them (`pnpm check:i18n-dead-keys` listed them as confirmed dead), and say the same thing. The zh value of `publicForm.thankYouTitle` ends with a full-width exclamation mark instead of an ASCII one.

**Authored values still win.** An authored `successMessage`, `submitText` or `cancelText`, a plain string or a per-locale map, and a `thank-you` behaviour's own `title` and `message`, render as authored in every locale. Only the defaults are localized. No schema key is added, renamed or retyped.

**Three English strings change their rendered text**, because each is now the value of a key whose English differs from the old literal:

- the loading line, `Loading form...` with three ASCII full stops, is now `Loading form…` with the typographic ellipsis;
- the thank-you heading, `Thanks!`, is now `Thank you!`, in the default arm, `WizardForm` and the form page;
- the form page's default thank-you message, `Your submission has been received.`, is now `Your submission has been received successfully.`

Every other English default renders the same text as before. With no i18n provider mounted, plugin-form's forms still render English from their defaults tables, which `pnpm check:i18n-keys` holds byte-identical to the `en` pack.
