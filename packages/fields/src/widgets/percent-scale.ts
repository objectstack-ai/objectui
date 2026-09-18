/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ONE ruling over BOTH percent faces (objectui#9808): a declared `scale`
 * outside the width the engine can render is CLAMPED into it and REPORTED —
 * ⛔ never carried into a formatter that throws.
 *
 * ── Why this is its OWN module and NOT exported from the barrel ──────────
 * `PercentField` and the `formatPercent` door in `index.tsx` both need the one
 * spelling, and this package's standing shape for exactly that is a module the
 * barrel IMPORTS and deliberately leaves out of its `export *` block —
 * `address-format.ts`, `numberBadInput.tsx` and `file-affordance.ts` are all
 * shared that way, the last with the comment "deliberately NOT re-exported
 * below, so this package's published surface is unchanged". Sharing one
 * spelling needs one MODULE, ⛔ not an entry export. Publishing these two
 * symbols would also publish this module's side effects — the warn-once `Set`
 * and the `console.warn` — as contract, and would make the retirement in the
 * SUNSET note below a breaking removal rather than a deletion.
 *
 * ── The defect ──────────────────────────────────────────────────────────
 * `scale: 101` is a declaration `@objectstack/spec` accepts today (its
 * `FieldSchema` states "Decimal places (non-negative integer)" and carries no
 * upper bound), and it crashed BOTH percent faces with a `RangeError`:
 * `PercentField`'s readonly `toFixed` and its `step` attribute, and
 * `PercentCellRenderer` through `formatPercent`. ⚠️ On the cell face the throw
 * arrives from `toFixed` even though the path is `Intl`: `formatPercentBody`
 * CATCHES the `Intl` `RangeError` and its fallback is `toFixed(precision)`,
 * which refuses the same width. For a React render either one takes out the
 * subtree, and the author had no signal — the platform accepted the
 * declaration and failed at render time.
 *
 * ── Why CLAMP and not REFUSE ────────────────────────────────────────────
 * AGENTS.md #0.1 bans a renderer-side fallback that makes NON-COMPLIANT
 * metadata work. This declaration is compliant — measured at source on
 * `objectstack-ai/objectstack`, `packages/spec/src/data/field.zod.ts` declares
 * `scale` as `z.number().int().min(0).optional()` with no `.max(`. So a
 * refusal here would be this renderer inventing a contract STRICTER than the
 * spec, which is #0.1 in mirror image. The declaration-side upper bound is
 * owed, and it is filed where it lives — objectstack#18972 — ⛔ not reached
 * into from here.
 *
 * What is left for a renderer is the medium's own limit: the value is not in
 * doubt, only the width. Refusing to draw the number would blank a grid column
 * over a display width, so the faces render what the engine CAN render and say
 * that they did.
 *
 * ── ⚠️ SUNSET — this ruling is CONDITIONAL, and the condition is upstream ──
 * The whole #0.1 argument above rests on one fact: `@objectstack/spec` does
 * not bound `scale`. objectstack#18972 is the card that bounds it. On the day
 * this repository takes a spec whose `scale` refuses a width above the
 * ceiling, `scale: 101` stops being a compliant declaration — and from that
 * moment this clamp IS the lenient renderer-side fallback #0.1 bans, kept
 * alive by nothing but its own inertia. ⇒ whoever bumps `@objectstack/spec`
 * past that bound owns this module: the clamp becomes redundant (the
 * declaration cannot arrive), and the correct move is to DELETE it, ⛔ not to
 * keep a second de-facto contract next to the enforced one. Stated here and in
 * this change's changeset rather than left to be rediscovered, because an
 * argument whose premise has quietly expired reads exactly like a live one.
 *
 * ── The reporting half ──────────────────────────────────────────────────
 * The clamp alone would be the silent guess objectui#9808 refuses, so a moved
 * width always emits a `console.warn` naming the declared value, the width
 * actually rendered and the card. Deduplicated by declared value, because a
 * percent COLUMN re-renders per row and an undeduplicated warning would bury
 * the one line that matters. ⚠️ The dedup is per MODULE LIFETIME and not per
 * face: measured, the widget warning for a given width fires once and a cell
 * rendering the SAME width afterwards is silent. So the honest claim is "the
 * first face to render this width says so", ⛔ not "both faces say so".
 *
 * ── What reaches this function ──────────────────────────────────────────
 * ⚠️ ⛔ NOT only the two percent faces. It sits behind `formatPercent`, which
 * at the time of writing has seven non-test call sites — the percent cell,
 * `MetricWidget`, `recordFields`, the `DetailView` chip, `ObjectGantt`, the
 * `ObjectGrid` footer and `useColumnSummary` — and a dashboard metric's width
 * comes from a numeral-format PATTERN, ⛔ not from a field face. Every one of
 * them moves from crash to clamp-and-report for an out-of-range width, which
 * is the same ruling and a wider blast radius than "both percent faces".
 * ⚠️ ⛔ Do not restate that count in prose that nothing re-derives (AGENTS.md
 * #9): the live answer is whatever a search for `formatPercent` outside tests
 * returns today.
 *
 * ⛔ This says nothing about which MEMBER a face reads, nor about what an
 * ABSENT `scale` means — the two faces still spell that absence differently
 * (`PercentField` 2, `PercentCellRenderer` 0) and objectui#9810 holds the
 * question of what `scale` means to the write path versus the display path.
 * Neither is touched here.
 */

/**
 * The widest fraction the percent formatters can actually render.
 *
 * ⛔ NOT a number this renderer picked. It is the bound both formatting APIs
 * this package reaches for define for themselves, and on the INTEGERS they
 * define the same one — which is what makes a single ruling over both faces
 * possible at all. Re-measured on node v22.22.2, the two APIs and the two
 * ends:
 *
 * ```
 * (25).toFixed(100)                                           -> "25.000…"
 * (25).toFixed(101)                                           -> RangeError
 * (25).toFixed(-1)                                            -> RangeError
 * new Intl.NumberFormat('en', { maximumFractionDigits: 100 }) -> ok
 * new Intl.NumberFormat('en', { maximumFractionDigits: 101 }) -> RangeError
 * new Intl.NumberFormat('en', { maximumFractionDigits: -1 })  -> RangeError
 * ```
 *
 * ⚠️ The two agree on the INTEGERS ONLY, and the difference is measurable off
 * them: `(25).toFixed(100.5)` and `(25).toFixed(NaN)` both render, while
 * `Intl` refuses either. It costs the cell face nothing, because
 * `formatPercentBody` falls back to `toFixed` when `Intl` throws — so a
 * non-integer or unreadable width rendered through that fallback before this
 * module existed and renders the same text now, with a diagnostic added.
 *
 * ⚠️ Re-measure rather than trust this comment if it ever matters again: the
 * bound is a RUNTIME property of the engine (ECMA-262 `Number.prototype.
 * toFixed` and ECMA-402 `SetNumberFormatDigitOptions` each state it), ⛔ not a
 * constant this repository owns. That disclaimer is one of the reasons this
 * symbol stays module-private: no consumer of a published constant could see
 * it.
 */
export const PERCENT_SCALE_CEILING = 100;

/** Declared widths already reported, so a 1,000-row grid warns once. */
const warnedPercentScales = new Set<number>();

/**
 * Clamp a declared fraction width into the renderable domain, reporting any
 * width the engine could not have rendered. See this module's header for the
 * ruling, the sunset condition and what actually reaches here.
 */
export function renderablePercentScale(declared: number): number {
  // `Number(...)` rather than a `typeof` test, because the ENGINES coerce:
  // `(25).toFixed('2')` and `maximumFractionDigits: '2'` both render two
  // decimals today, and `2.9` renders two on both. This function moves only
  // widths the engines would have REFUSED, so a declaration that already
  // rendered keeps rendering identically — the parameter is typed `number`,
  // but the value reaching it comes from untyped JSON metadata.
  const asNumber = Number(declared);
  const renderable = Number.isFinite(asNumber)
    ? Math.min(PERCENT_SCALE_CEILING, Math.max(0, asNumber))
    : 0;
  // The predicate is "the engine could not have rendered this", ⛔ not
  // "the value changed spelling": `renderable !== declared` would report the
  // string `'2'` becoming the number `2`, which is a width nothing moved.
  const refused = !Number.isFinite(asNumber) || asNumber < 0 || asNumber > PERCENT_SCALE_CEILING;
  if (refused && !warnedPercentScales.has(declared)) {
    warnedPercentScales.add(declared);
    console.warn(
      `[ObjectUI] percent field: a declared \`scale\` of ${declared} is outside the ` +
        `0-${PERCENT_SCALE_CEILING} fraction width this platform can render; ` +
        `rendering at ${renderable} instead (objectui#9808).`,
    );
  }
  return renderable;
}
