---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

A console page route stops loading the Studio's designers, the interface list and one file per icon before its content (objectui#12187).

- **The built-in designers load when something reads them.** The package entry used to start loading every built-in Preview and Inspector, with the icons they draw, as soon as it was imported, so every console page fetched them before its content, on routes that never show a designer. The entry now hands that loader to the three designer registries, and the first read of any of them runs it: a reader hook (`useRegisteredMetadataPreview` and the rest) or a `getMetadata*` / `listMetadata*` call. Importing the entry still registers every built-in designer with no call from the host; a reader that renders first shows its "designer missing" state and then the designer, as it did while the chunk was loading. A host that reads the registries imperatively sees the built-ins from the read after the one that started the load, once the chunk has arrived.
- **`PageView` loads `InterfaceListPage` only for an interface page.** The list is drawn only for a page with `interfaceConfig.source`, and such a page now shows a spinner while it loads. Other pages no longer fetch it.
- **The console writes the icons its first screen imports by name to one chunk, `vendor-icons-shell`.** Each of those icons had a chunk of its own, so a page load made one request per icon before its content. Every member of the new chunk is one a static import chain from the entry reaches, so no icon moves onto the first load; an icon used only lazily keeps its own chunk.

No export, prop or type changes.
