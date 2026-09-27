---
'@object-ui/components': minor
---

feat(components): `Calendar` takes a `localeTag`, a BCP-47 tag it reads in place of the display locale (objectui#10747)

A `Calendar` with no `locale` reads the session's display locale
(objectui#10722). A caller that formats its other dates with a tag of its own
had no way to hand the calendar that tag: `locale` takes a date-fns `Locale`
object, which a caller outside this package can only build with date-fns and a
resolver of its own.

`localeTag` takes the tag and resolves it through the same chain as the display
locale: `de-CH` reads date-fns `de` (caption `März 2020` over `Mo Di Mi …`), and
a tag date-fns has no locale for, or a malformed one, reads `enUS`.

- **An explicit tag wins over the display locale.** With no `localeTag`, a
  `Calendar` reads the display locale exactly as before.
- **A date-fns `locale` object still wins over both.**
- **No new export.** The input is the whole addition; the resolver stays
  private to this package.

`minor`, not `patch`: this adds an input to a published component, which is new
API surface, not a fix to an existing one.
