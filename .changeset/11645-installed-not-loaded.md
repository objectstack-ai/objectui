---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Installed Apps now reads a package the runtime refused to load at startup as "Not loaded", says why, and keeps its Uninstall (objectui#11645).

After a restart whose startup check refused a package built for another platform protocol, the install-local listing still lists the package, so it can be uninstalled or replaced. Since `@objectstack/*` 17.7.0 the listing marks such an entry with `notLoaded: { code, requiredRange }` in place of `withSampleData`. Installed Apps drew every listed entry as installed. Now:

- the row carries a "Not loaded" badge beside its version, and one sentence naming the reason: for `OS_PROTOCOL_INCOMPATIBLE`, that the package targets protocol `requiredRange`, which this runtime does not support. A refusal code the console has no sentence for still reads "Not loaded" and names the code;
- Uninstall stays on the row. Its confirm and its result no longer say that the package stays loaded until the next restart;
- the package's Details page no longer offers re-seed or purge of sample data for such an entry, since both act on objects the runtime never registered. Uninstall and Reinstall stay.

A loaded entry renders as before.

The language packs gain `marketplace.notLoaded.badge`, `marketplace.notLoaded.protocolIncompatible`, `marketplace.notLoaded.otherReason`, `marketplace.uninstall.confirmNotLoaded` and `marketplace.uninstall.successNotLoaded`, in all ten languages.
