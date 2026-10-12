---
'@object-ui/console': patch
---

The console builds again on a case-insensitive filesystem, which is macOS's default (objectui#12184). Two modules in the console's settings pages, the workspace-timezone prompt dialog and the logic behind it, had paths that differed only in case once the extension was dropped. TypeScript tries `.ts` before `.tsx`, so on such a filesystem the dialog's import resolved to the logic module and `tsc` failed. The logic module is now `workspaceTimezonePromptLogic.ts`. What the prompt does, and every i18n key it reads, stays as it was.
