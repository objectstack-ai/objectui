---
---

Docs only, no package released: the published objectui skill's project-setup guide (`skills/objectui/guides/project-setup.md`, the `@object-ui/app-shell` section) no longer mounts `ObjectView` as a bare element carrying an `objectName` prop — a prop the component never had (it reads the route's `:objectName` and resolves it against `objects`), a mount that threw on first render, and one that `ConsoleObjectViewProps` now refuses at compile time. The guide points at the `ObjectView` section of `packages/app-shell/README.md`, the one copy `pnpm check:doc-snippets` compiles, and says the shell runs under React Router (`react-router-dom` is its peer dependency) in place of the sentence that called it router-agnostic (objectui#11011).
