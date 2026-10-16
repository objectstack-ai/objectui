---
'@object-ui/app-shell': minor
'@object-ui/console': patch
---

The built-in metadata designers leave the console's first load: `@object-ui/app-shell` registers them from a chunk it loads on its own, once the package entry has run (objectui#11939, step 2 of objectui#6795).

Every built-in Preview, scoped Inspector and default Inspector used to be registered while the package entry was being evaluated, so their code sat on every page's first load although only metadata authors render them. The entry now starts loading them with a dynamic `import()` at its own module scope and registers them when that chunk arrives. Importing the package still registers every built-in designer with no action from the host; they are available a moment later than before instead of during the import. The entry for step 1 (the observable designer registries) says every built-in designer is still registered when the package loads: that held at step 1, and this step replaces it.

What a reader sees in that moment: a surface that renders before the chunk arrives shows its existing "designer missing" state, then the designer, with no reload. That is the observable registries of step 1 at work, through the `useRegistered*` hooks. A read with `getMetadataPreview`, `getMetadataInspector`, `listMetadataPreviewTypes` or `listMetadataInspectorTypes` returns what is registered at the moment of the call, so code that reads right after importing the package can find no built-in designer yet. During render, read through the hooks.

A host's own designer is kept, whichever arrives first. The built-ins are registered only for a type that has no designer yet: a host that calls `registerMetadataPreview` or `registerMetadataInspector` right after importing the package keeps its component when the built-ins land later, and a host that registers after they landed replaces the built-in, as before.

The three registrations whose registries are not observable stay where they were, during the entry's evaluation: the Related tab's anchors, the generic form's fallback schemas and the datasource resource.

`sideEffects` in `@object-ui/app-shell`'s `package.json` is unchanged. The module that registers the designers performs no registration at load time: the entry calls the function it exports.

No export is added, removed or changed. The console's dev-only designer gallery waits for the built-in designers to arrive before it renders its list, so it never lists zero designers.
