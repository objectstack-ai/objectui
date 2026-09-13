---
'@object-ui/plugin-grid': minor
---

The grid column-summary footer formats in the TENANT's locale, not the machine's (objectui#9294).

`formatSummaryLabel` in `packages/plugin-grid/src/useColumnSummary.ts` handed `Intl` no locale
argument at seven call sites — the currency arm (both branches plus its constructor-threw
fallback), the average arm, the plain numeric default, the percent-of-rows arm and the
count/non-numeric arm. An omitted or `undefined` locale is not "no opinion": it is **the
machine's** locale, which is neither of this renderer's two channels, and it is the one thing
`useDisplayLocale`'s own doc comment tells callers not to do. All seven now take the concrete
BCP-47 tag that hook already resolves (tenant locale, then UI language, then `'en'`) — the same
tag the cells directly above the footer are formatted with, and the same one the percent column
took in objectui#9269.

**BREAKING** — rendered output moves. Not only for the sessions that were wrong: it moves in
**every session whose browser locale differs from the tenant's**, which is the normal case for a
German tenant staffed on English systems or the reverse. Where the two happened to agree, output
is unchanged. Measured on one row of `1234.5` in a `EUR` column of scale 2, on a machine whose
locale is `en-US`:

| tenant locale | before (all sessions) | after |
|---|---|---|
| `en` | `Sum: €1,234.50` | `Sum: €1,234.50` (unchanged) |
| `de-DE` | `Sum: €1,234.50` | `Sum: 1.234,50 €` (symbol trails, after a no-break space) |
| `tr-TR` | `Sum: €1,234.50` | `Sum: €1.234,50` |

The size of what this repairs is why it ships as a declared break rather than quietly: a `de-DE`
tenant read `1,234.50` and parsed it by German convention as `1.2345` — three orders of magnitude
out, on a **currency total**. It is a sharper failure than the percent-sign move its parent card
repaired, because a sign changing sides is visible and a decimal separator changing is not:
`1,234.5` is a perfectly ordinary German number for a completely different value.

`minor` rather than `major` because this package ships in the fixed group whose major tracks
`@objectstack`'s (see AGENTS.md, "版本号策略"), so a breaking change is carried in the body.

**Not changed.** Only the locale tag moves. Every arm keeps the formatter and the fraction-digit
widths it already had — the currency arm still reads the column's declared `scale` (objectui#2131)
and the percent-of-rows arm still carries its own literal sign, both of which belong to
objectui#4589's number-display policy rather than to this card. Routing these arms through
`@object-ui/fields`' `formatCurrency` / `formatNumber` was measured and rejected for exactly that
reason: it discards the column's declared `scale`, fires a wholeness switch that drops a whole
amount's fraction digits, and pins the plain/average arms to a fixed decimal width — output moves
in `en` too, which no locale repair should do. The `colType === 'percent'` arm is untouched;
objectui#9269 landed it and it serves here as the control that proves the test fixture really
moves the tenant locale.
