---
'@object-ui/components': patch
---

`ui:button` resolves its authored `icon` through the shared `resolveIcon` instead of a
byte-equivalent copy of it (objectui#5993).

`renderers/form/button.tsx` carried its own `toPascalCase`, its own `iconNameMap` holding
the single `Home -> House` entry, and its own index into lucide's runtime `icons` record —
the same algorithm as `renderers/action/resolve-icon.ts`, but not the same function. The
`action:*` family, `complex/data-table.tsx` and both menu renderers already import the
shared one. The hazard was drift, not rendering: an alias added to `resolve-icon.ts` to
absorb a lucide retirement (the objectui#5586 / #5622 mechanism) reached every one of those
sites and silently missed `ui:button`, which would have gone on resolving the retired
spelling to nothing while the rest of the repo resolved it correctly.

**No behaviour changes, and that is measured rather than asserted.** The two
implementations were compared over 3547 names — every one of lucide's 1767 record keys in
both spellings, plus kebab-case probes (`arrow-right`, `dollar-sign`, `user-plus`), the
`Home` alias, retired spellings and `undefined`: 3539 identical by object identity, 8
differing only in the nullish flavour returned for a miss (the copy indexed the record and
got `undefined`; the shared resolver `?? null`s it), zero genuine forks. That one
difference cannot reach the DOM — `Icon` is consumed at exactly two sites, both
`{!isLoading && Icon && <Icon .../>}` truthiness tests, and React renders nothing for
`null` and `undefined` alike. Icon identity, `h-4 w-4` sizing, `iconPosition`, the loading
state and the `Loader2` spinner are unchanged, and are pinned by
`renderers/form/__tests__/button-shared-icon-resolver.test.tsx`.

Because behaviour is unchanged, the usual red-before ablation does not exist for this
change and none was manufactured. The one row in that suite that discriminates is
structural: it spies on the shared module and fails when the glyph does not come out of it,
which is red on the copy and green on the import.

`scripts/check-lucide-icon-record-names.mjs` drops `form/button.tsx` from
`DECLARED_RECORD_READERS` in the same commit — that gate rediscovers record readers from
source on every run and fails on drift in both directions, so the removal is verified by
the gate rather than declared. It is also what now guards the dedupe: a re-inlined copy
would be discovered as an undeclared record reader and fail. The census entry for the
`button` *type* stays, its resolver re-pointed at `resolve-icon.ts`, so `ui:button`'s
authored icon names are still judged against the live record.

`renderers/basic/icon.tsx` keeps its own copy deliberately and is untouched: `ui:icon`
draws a `SquareDashed` placeholder and warns on an unresolvable name (objectui#5631), which
the shared resolver does not do.

⚠️ **Dating that sentence: its first clause has since expired, and it is kept rather than
corrected (objectui#9772).** "Keeps its own copy" was a reading taken when this changeset was
written, at commit `194fae184`, 2026-08-25, and there it was true: `basic/icon.tsx`
defined its own `toPascalCase`, held its own `iconNameMap` carrying the single
`Home -> House` entry, and indexed lucide's runtime `icons` record itself. It stopped being
true at `e176053094`, 2026-09-03, "one lucide icon-name seam, seven resolvers down to one",
which deleted all three from that file and routed `ui:icon` through the shared seam. The
clause is left standing because it records why THIS change left `ui:icon` alone; rewriting
it to match a later tree would publish an accurate sentence in place of the reason, and the
reason is the half worth releasing. ⛔ For where `ui:icon` resolves at the commit you are
reading this on, do not trust this paragraph — re-take it: read what
`renderers/basic/icon.tsx` imports from `renderers/action/resolve-icon`, and the docblock
beside that lookup, which is where the file's own account of the move lives.

⛔ Only that first clause expired. "Is untouched" is scoped to THIS change — objectui#5993
did not touch that file — and not to every change after it, so a later commit touching the
file does not falsify it, and it is left exactly as written. The reason clause is likewise
unaffected: `e176053094` kept the `SquareDashed` placeholder and the objectui#5631 warning
at the `ui:icon` call site, which is why they, and not the copy, were the reason given.
