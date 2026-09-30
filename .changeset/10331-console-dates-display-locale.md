---
'@object-ui/app-shell': patch
---

Three console dates now follow the display locale, not the UI language (objectui#10331).

- The installed-packages list's "Installed …" date, the marketplace catalog cards' relative
  published time ("3 days ago") and the cloud-connection panel's "Since" date take their
  locale from `useDisplayLocale()`. They used to format with the UI language, so a regional
  display locale was ignored: an English UI with a `de-CH` display locale read `3/4/2020`
  where it now reads `4.3.2020`, and "3 days ago" where it now reads "vor 3 Tagen".
- None of the three falls back to the machine's locale or to a literal `'en'` any more. The
  installed date used to fall back to the machine's locale when the UI language was empty.
