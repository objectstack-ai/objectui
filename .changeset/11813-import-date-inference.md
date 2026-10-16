---
'@object-ui/plugin-grid': patch
---

Import no longer infers a text column as Date because its values end in a number (objectui#11813). The mapping step labelled a column of `Imported QA task 1`, `Imported QA task 2` as Date and showed "Looks like Date" under a text field. The column type check trusted `Date.parse`, and the browser's parser reads `Phase 2`, `Building 7` and `Room 12` as dates in 2001, and `Marketing 2026` as March 2026.

A value now infers as a date only when it has a date shape first, and `Date.parse` then confirms it. The shapes are numeric dates with the year first or last (`2026-10-07`, `2026/10/07`, `10/07/2026`, `7.10.2026`, `10/7/26`), ISO-8601 date-times and year-months, and English month-name dates whose other words are weekdays or time markers (`Oct 7, 2026`, `7 October 2026`, `Wed, 07 Oct 2026 12:00:00 GMT`). Whether `07/10/2026` is read day-first or month-first is unchanged.

Behaviour change: a month name in another language is not read as a date. Before, the parser accepted some by their first three letters (`7 octobre 2026`, `7 Januar 2026`) and not others (`7 juin 2026`, `7 März 2026`); such a column now infers as text, like the ones it never read.

The inferred type feeds the mapping hint and the score of a fuzzy name match (contains, token or synonym), which an incompatible type halves. So such a column could also lose its suggested text field: `Task title` was not mapped onto a `Title` text field. No value is converted differently, and `inferColumnType` keeps its signature.
