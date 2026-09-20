---
"@object-ui/plugin-calendar": patch
"@object-ui/i18n": patch
---

Localize every accessible name `CalendarView` authors itself.

The component hard-coded the accessible names of its own landmarks and controls
in English, so no locale pack could reach them. A screen-reader user on a
translated console heard "Calendar" and "Calendar grid" — the only names those
two landmarks have — plus the toolbar buttons and both resize grips, in English,
while every sighted string beside them was translated.

All of them now resolve through the `createSafeTranslation` hook the component
already used for its visible copy, and the keys land in all ten locale packs
under `calendar.a11y`. Two of the repaired strings were English frames wrapped
around already-localized data (the current-date button and the day gridcell's
event count); those are now pack-owned sentences whose translations can put the
date and the count where each language's grammar wants them, and the gridcell's
count is a plural family with a base key so the categories a pack does not
enumerate resolve in its own language rather than falling through to English.
