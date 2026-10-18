---
'@object-ui/console': minor
---

A settings page's `info_banner` row speaks the session locale, draws a warning in amber, and renders its body as Markdown (objectui#12671, the objectui half of objectstack#23855).

- The banner's title and body read the platform's `settings.NAMESPACE.banners.BANNER_ID` slot (`@objectstack/spec`, objectstack#23886): `title` translates the specifier's `label` and `text` its `bannerText`, keyed by the specifier's `id`, the same way a group's title reads `groups.GROUP_ID.title`. When the bundle has no entry, the manifest's own words still render. No other spelling of the slot is read.
- `bannerSeverity: 'warning'` draws an amber callout with a warning icon. `error` stays the destructive callout, and `info`, `success` and an unset severity keep the neutral one.
- `bannerText` renders as the Markdown body the spec declares, through the docs portal's Markdown renderer and its sanitizer, so inline code, emphasis and links draw as such instead of as their source characters. The renderer loads on first use, so it adds nothing to the console's first page load.
