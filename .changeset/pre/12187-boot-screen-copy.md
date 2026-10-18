---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The console boot screen says one honest line, and shows no English before the user's locale (objectui#12187, the first of its three fixes).

`LoadingScreen` now draws the product name, one line ("Opening your console…", translated in all ten built-in packs) and a spinner. The three staged steps it walked on a 1200 ms timer, which tracked no real work, are gone, and so is the line about "setting up a new environment", which was never one. The error and retry block is unchanged.

The screen takes its language from the `I18nProvider` (`useObjectTranslation().language`) instead of `document.documentElement.lang`. The provider writes that attribute after its children's first render, so a `zh-CN` browser saw the English copy on the first paint and kept seeing it until the step timer's first tick re-rendered the screen. The line is read off the active language's resident built-in catalogue. While that catalogue is not resident the line is left out rather than shown in English, and it appears when the catalogue lands.

The splash's root element carries a `data-boot-splash` attribute in every state (loading, `message` and error), which is its language-independent hook for a readiness wait or smoke test that needs to know whether the splash is still up, since the line depends on the locale and can be absent.

**Breaking: four keys are retired from all ten `@object-ui/i18n` built-in packs**, and `TranslationKeys` narrows with them:

- `console.loadingSteps.connecting`: no replacement, the boot screen shows no steps.
- `console.loadingSteps.loadingConfig`: no replacement, the boot screen shows no steps.
- `console.loadingSteps.preparingWorkspace`: no replacement, the boot screen shows no steps.
- `console.loadingHint`: no replacement, the boot screen shows no hint line.

`console.initializing` keeps its key and carries the new line in every pack ("Initializing application…" becomes "Opening your console…"). An app that supplies its own values for the four retired keys can drop them: nothing reads them any more.
