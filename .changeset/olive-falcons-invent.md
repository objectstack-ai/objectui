---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

fix(app-shell): the report inspector no longer destroys a localized title or label

`ReportChartSchema.title` and `ReportSchema.label` are `I18nLabel` — a plain
string **or** an inline per-locale map. The report inspector narrowed both to
the string arm when reading and wrote the typed string back over the whole
value, so against a stored map the two halves failed in opposite directions:
Studio painted an empty box over a report that has a title, and the retype that
empty box invited replaced the map with a bare string, losing every other
locale. Committing the empty box untouched deleted the stored map outright.

Reads now go through `pickLocalized` and writes through `setLocalized`, so an
edit lands in the active locale's entry and every other locale survives. An
author shown a display fallback from another locale can neither overwrite nor
delete the locale it was borrowed from.

**Clearing is ruled, not inherited.** Clearing the box removes only the active
locale's entry; when that was the last entry the key is dropped entirely, which
is byte-for-byte what clearing a plain-string value already did.

**What an author who does nothing differently now gets:** a report whose title
or label is a plain string behaves exactly as before — same box, same committed
value, including on clear. A report whose title or label is a locale map now
shows their own locale's string instead of a blank box, and editing it keeps
every other language instead of deleting it.

`@object-ui/i18n` gains `clearLocalized`, the clear arm of the same
single-locale editor `setLocalized` serves. Additive: no existing export
changed shape.
