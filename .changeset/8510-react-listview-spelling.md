---
---

The SDUI workbench preview's react page source (`apps/console/src/sdui-workbench-preview.tsx`)
now binds its ListView with `data={{ provider: 'object', object: 'showcase_project' }}` instead of
the `objectName` spelling that `@objectstack/spec` 17.4.0 retired from the react-tier contract
(`react-prop-retired` in `@objectstack/lint`), and a console test pins that binding. The preview is a
dev-server-only harness page — the console build's only entry is `index.html` — so no published
behaviour changes. The same rewrite in `content/docs/guide/react-pages.md` is documentation only.
