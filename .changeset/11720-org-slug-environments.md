---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The organization Settings page no longer offers a slug edit the framework will refuse (objectui#11720). From framework 17.7.0, better-auth's organization update refuses a new slug with `403` while the organization has an environment that is neither archived nor failed, and every cloud organization is born with its production environment, so every owner's slug edit on this page failed as a toast. The page now asks the data API for the organization's `sys_environment` rows, counted the way that guard counts them. While one counts, the slug renders read-only with a note that says why: a rename also moves the environments' subdomains.

**Behaviour change.** A save sends `slug` only when it changed. A name-only save therefore carries no slug, so it answers `200` on every host, and a stale form can no longer write back a slug that was renamed elsewhere. A single-environment runtime (one whose runtime config serves `singleEnvironment: true`, as the CLI's `os serve` does) has no `sys_environment` object, so the page does not ask there at all. On any other host without that object the read is refused. Either way the field stays editable, and a changed slug goes out in the same single update call as before. The refused read is one extra request per owner visit to the page.

**Clause-②: yes (widening)** — the `en` pack of `@object-ui/i18n`, and with it `TranslationKeys`, gains `organization.settings.slugLockedNote`, translated in all ten packs. No export, prop or schema key is added; the environment read stays module-private.
