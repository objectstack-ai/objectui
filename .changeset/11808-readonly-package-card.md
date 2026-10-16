---
'@object-ui/app-shell': patch
---

Studio's landing page now points a read-only package at the routes that exist for customizing it (objectui#11808).

- **A read-only package's card links to its org overlay.** Code and installed packages are read-only (ADR-0070 D2): nothing new is authored into them, and *Duplicate* does not apply to them, because ADR-0070 D4's Duplicate clones a writable base. They are customized by org overlay where the item's metadata type allows it (`allowOrgOverride`, ADR-0005). Each read-only card now has a *Customize with an overlay* link to the package's metadata directory (`/apps/setup/metadata?package=…`), which marks per type whether it accepts an overlay. Clicking the card itself still opens the package for browsing.
- **The marketplace, where the runtime has one.** Below the read-only section's explanation, *Or install a template app from the marketplace* opens the marketplace route that Home's *Start with a template* opens. A runtime without a marketplace (`features.marketplace: false`) shows no such link, because that route does not exist there.
- **The landing's description says the same.** It used to call code-loaded packages "browse only"; it now says they are browsed here and customized with an org overlay.

*Duplicate* stays on writable bases and is unchanged. Nothing is added to the package entry: no export, prop, route or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
