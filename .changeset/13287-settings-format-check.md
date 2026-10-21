---
'@object-ui/console': patch
'@object-ui/i18n': patch
---

Settings pages: a `url`, `email`, `phone` or `color` value that misses the format its type declares now blocks Save (objectui#13287). No request goes out, the row is marked inline with a message naming what the format expects, and focus moves to the first such row, on the same path as the `required` check. The grammars are the settings service's own (objectstack#24882), judged on the trimmed value; an empty value is left to `required`, and a hidden or env-locked row is not judged. Adds `console.settingsView.invalidPhone` and `console.settingsView.invalidColor` to every locale pack; `email` and `url` reuse `validation.email` and `validation.url`.
