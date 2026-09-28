---
'@object-ui/types': patch
'@object-ui/components': patch
---

Correct author-facing text that objectui#6771's retirement of the `body` child-list spelling
left false (objectui#8284). Only wording moves; no key, value or rendered result does.

- `@object-ui/types` — the `body` refusal on `box`, `span`, `container`, `flex`, `stack`,
  `grid`, `scroll-area`, `form` and `toggle` explained that `body` "is inherited from
  `BaseSchema`, so an authored `body` parsed green here". Since objectui#6771, `BaseSchema`
  refuses `body` by name itself, so that explanation no longer holds. The message now says that
  `body` is the child-list spelling objectui#6771 retired, refused by name, and that `children`
  is the one child-list key. The same refusal on `alert` and `badge` said that an authored
  `body` "now parses green through `.passthrough()`", which that refusal itself contradicts;
  like the other nine, it now says that `body` is refused here by name and that `children` is
  the one child-list key. The refused key, the replacement it names, the issue code and the
  issue path are unchanged; the same string is still the `.describe()` metadata.
- `@object-ui/components` — the `div` deprecation notice said that every replacement except
  `card` reads `children` only, so a blind retype drops `body` content. Since objectui#6771,
  `card` and `div` itself read `children` only as well. The notice now says that validation
  refuses `body` by name and that neither `div` nor any replacement draws it. The replacements
  it offers are unchanged.
