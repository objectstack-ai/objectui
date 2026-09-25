---
'@object-ui/plugin-detail': patch
---

Every timestamp on the record page formats in the DISPLAY locale, not the
machine's (objectui#9786).

`useDisplayLocale`'s own doc comment names the one thing a caller must not do:
reach past the hook and hand `Intl` the `undefined` it gets on an unconfigured
workspace, because `undefined` means the MACHINE's locale — neither the
tenant's configured regional default nor the active UI language. objectui#9453
put the `summaryFields` chip on that hook. The timeline, history, diff and
provenance surfaces in the same package were still passing nothing at all, so a
German tenant read one stored instant one way in a list cell and another way on
the record page it opened, and on an unconfigured workspace those surfaces
agreed with whatever locale the host machine happened to have.

Ten call sites across nine files now format with `useDisplayLocale()`:
`ActivityTimeline`, `RecordComments`, `RecordActivityTimeline` and
`ThreadedReplies` (each helper's past-a-week date tail), `PointInTimeRestore`
(its past-a-day date-time tail), `ConcurrentUpdateDialog` (the racer's
`updated_at`), `DiffView` (a `date` field's diff lines), `HistoryTimeline`
(both its absolute face and its `Intl.RelativeTimeFormat` relative one) and
`RecordMetaFooter` (the absolute date behind the hover tooltip).

**Only the locale moved.** Every options bag — `dateStyle`, `timeStyle`, the
relative-time `numeric: 'auto'` — is unchanged, and each surface's relative
phrases still come from the same `detail.*` pack keys objectui#7162/#7163 wired
up. Every helper takes the resolved tag as a parameter rather than becoming a
hook. Seven of the nine have no choice — they run inside a `.map()` or a
`useMemo`, where a hook cannot go, which is the same shape and the same reason
the `t` beside them is threaded. `ConcurrentUpdateDialog` and
`RecordMetaFooter` call theirs from a component body and could have read the
hook directly; they thread it too, so the nine keep one shape.

**One published prop changes its default, not its meaning.**
`HistoryTimelineProps.locale` documented itself as defaulting to the browser's
locale; it now defaults to `useDisplayLocale()` and is an override when stated.
No call site in this repo passed it, which is why this site was
invisible to the card's census: the census matched a call with **no argument**,
and this one passed a variable that was `undefined` at runtime.

**The count the card carried was 11 across 9 files; the repaired population is
10 across 9.** Re-derived on the current tip with comments masked, the card's
instrument returns 9 code sites plus 2 lines of `PointInTimeRestore`'s doc
comment that spell `toLocaleDateString()` and `toLocaleString()` while
explaining why that file's tail differs from its siblings'. Prose is not a call
site. The tenth is the `HistoryTimeline` prop above, which that instrument
cannot see at all.

**Two instruments land with the repair, because the repair alone is what
happened the last five times.** `detailTimestamps.displayLocale-9786.test.tsx`
renders every surface whose face reaches the DOM under a declared `de-DE`
session and a declared `en` one and requires the two readings to differ — an
assertion the runner's own locale cannot satisfy, since before this change both
legs came from the machine and were byte-identical whatever the machine was. It
also patches the `Intl` constructors and `Date.prototype.toLocale*` and inspects
the argument each call actually receives, which is the only way to catch a
variable that resolves to `undefined`, and the only way to reach
`RecordMetaFooter` — whose absolute face is a `TooltipContent` child that Radix
keeps out of the DOM until the tooltip opens.
A census pin reddens when a new bare, `undefined`- or hard-coded-tag call site
is written; it masks comments before it counts, and when it landed it declared
`InlineFieldInput`'s `en-CA` as an exemption with its reason — that call fed
`<input type="date">`, whose value HTML defines as `YYYY-MM-DD`, so it was an ISO
formatter and not a display locale. It landed scoped to this package and, under
the ruling on this card, became the one repository-wide census in
`@object-ui/i18n` (`machineLocaleCensus-9909.test.ts`, objectui#9909), which
carried that exemption forward. objectui#10625 later removed the call:
`InlineFieldInput`'s date editor now renders `@object-ui/fields`' `DateField`,
and the exemption went with it.

⛔ Not repaired here: the same class outside this package. A mechanical scan of
the whole repository's non-test sources — comments masked, the same matcher the
census pin uses — returns sites across many other packages, and ⛔ none of them
was read for intent, which the one that was shows to matter: `collaboration`'s
single hit is a deliberate `catch` fallback for a tag `Intl` itself rejected,
not this defect. The number is deliberately not written down here; re-derive it,
and read each hit before pricing a sweep. This card's fence was
`packages/plugin-detail`, and whether a repo-wide gate should exist was left
undecided by the card that opened it.
