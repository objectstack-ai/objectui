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
 * metadata work. This declaration is compliant — and the premise is stated as
 * what THIS REPOSITORY INSTALLS, ⛔ never as what some other repository's
 * `main` says today. The lockfile resolves `@objectstack/spec` 17.4.0, and
 * that door ACCEPTS a percent field declaring a `scale` above the ceiling; a
 * refusal here would therefore be this renderer inventing a contract STRICTER
 * than the contract it is built against, which is #0.1 in mirror image.
 *
 * ⚠️ The distinction is not pedantry — it is the whole reason the SUNSET below
 * has an instrument. The upstream bound (objectstack#18972, landed as
 * objectstack#19083) is MERGED and UNRELEASED: it is on that repository's
 * `main` and it is not in 17.4.0, so the premise held here and had already
 * stopped holding at source while this very change was open. ⇒ ⛔ never
 * re-derive this premise by reading the other repository; the only reading
 * that governs this module is what the installed spec's door answers, and
 * `PercentScaleOutOfRange-9808.test.tsx` asks it on every run.
 *
 * What is left for a renderer is the medium's own limit: the value is not in
 * doubt, only the width. Refusing to draw the number would blank a grid column
 * over a display width, so the faces render what the engine CAN render and say
 * that they did.
 *
 * ── ⚠️ SUNSET — this ruling is CONDITIONAL, and the condition is upstream ──
 * The whole #0.1 argument above rests on one fact: the `@objectstack/spec`
 * THIS REPOSITORY INSTALLS does not bound `scale`. The trigger is therefore a
 * SPEC RELEASE this repository takes, ⛔ not the upstream card landing — that
 * already happened (objectstack#18972, landed as objectstack#19083) and
 * changed nothing here, because the bound is unreleased at 17.4.0.
 *
 * On the day this repository installs a spec whose `scale` refuses a width
 * above the ceiling, `scale: 101` stops being a compliant declaration — and
 * from that moment this clamp IS the lenient renderer-side fallback #0.1
 * bans, kept alive by nothing but its own inertia. ⇒ whoever bumps
 * `@objectstack/spec` past that bound owns this module: the clamp becomes
 * redundant (the declaration cannot arrive), and the correct move is to DELETE
 * this file, ⛔ not to keep a second de-facto contract next to the enforced
 * one.
 *
 * ⭐ And that is a TEST, ⛔ not a sentence. `PercentScaleOutOfRange-9808.test.
 * tsx` parses a percent field declaring `PERCENT_SCALE_CEILING + 1` through
 * the installed `FieldSchema` and requires it to be ACCEPTED; the bump turns
 * that row red and its failure message says this file is to be deleted. An
 * argument whose premise has quietly expired reads exactly like a live one —
 * which is not a hypothetical here: this module's premise expired at source
 * ten minutes after it was written, and nothing in the tree noticed.
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
 * ⚠️ ⛔ NOT only the two percent faces. It sits behind `formatPercent`, whose
 * non-test callers reach well past them — a dashboard metric among them, whose
 * width comes from a numeral-format PATTERN and ⛔ not from a field face. Every
 * one of them takes this ruling for a width above the ceiling, which is a wider
 * blast radius than "both percent faces".
 * ⚠️ ⛔ How many, and which, is deliberately NOT written here (AGENTS.md #9):
 * the live answer is whatever a search for `formatPercent` outside tests
 * returns today, and a figure that is still correct is the dangerous case, not
 * the safe one — a reader who spot-checks it confirms it and is wrong the
 * moment a caller is added.
 *
 * ── Also the NUMBER faces (objectui#10071) ─────────────────────────────
 * The ceiling is the engine's, ⛔ not the percent format's, so the three
 * non-percent readers of a declared `scale` hit it identically: the number
 * cell (`NumberCellRenderer`, through `formatDisplayNumber`'s `Intl`), a
 * grid's computed column (`computeRow`'s `toFixed`), and the grid currency
 * cell display (`currencyText` in `GridField`, face label
 * `grid currency cell`, through `formatDisplayNumber`'s `Intl` —
 * objectui#10355). They take this SAME
 * ruling through `renderableFractionScale`, each under its own face label and
 * card, so the percent diagnostic above stays byte-identical. The SUNSET
 * applies to them unchanged: `NumberScaleOutOfRange-10071.test.tsx` asks the
 * installed spec the same question for a computed number field, and on the
 * day it answers differently every importer of this module goes with it.
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

/** Declared widths already reported, keyed by face and width, so a 1,000-row
 *  grid warns once per face. */
const warnedScales = new Set<string>();

/**
 * Clamp a declared fraction width into the renderable domain for the percent
 * faces (objectui#9808). See this module's header for the ruling, the sunset
 * condition and what actually reaches here.
 */
export function renderablePercentScale(declared: number): number {
  return renderableFractionScale(declared, 'percent field', 'objectui#9808');
}

/**
 * The one ruling, for any face that turns a declared `scale` into fraction
 * digits: a width the installed spec accepts and the engine refuses is clamped
 * to the ceiling and reported once per `face` and width, naming `card`.
 */
export function renderableFractionScale(declared: number, face: string, card: string): number {
  // ⭐ The predicate is the WHOLE ruling, so read it as one sentence: fire on a
  // width the installed spec ACCEPTS and the engine REFUSES, and on nothing
  // else. `Number.isInteger` is the spec's own `int()` shape and `> ceiling`
  // is the engine's own bound, so the set this function acts on is exactly the
  // gap between the two — which is the defect objectui#9808 reports and, when
  // the SUNSET above closes the gap upstream, the empty set.
  //
  // ⛔ Deliberately NOT a clamp over the whole domain. `-1`, `Infinity`, `NaN`,
  // `2.5` and a string `'101'` are widths the installed `FieldSchema` already
  // REFUSES (measured: `int()` rejects the non-integers and the non-finite,
  // `min(0)` rejects the negative), so rescuing them here would be a
  // renderer-side default around bad input — AGENTS.md #0.1's own listed
  // example, and it would be doing it inside the module that cites #0.1 as its
  // reason for existing. They keep their pre-existing path untouched: `-1` and
  // `Infinity` still reach `toFixed` and still throw, exactly as before this
  // module existed, and the producer is where that is fixed.
  //
  // ⚠️ `declared` is returned UNCOERCED on that path, on purpose. The engines
  // coerce for themselves — measured, `(25).toFixed('2')` and
  // `maximumFractionDigits: '2'` render two decimals and so does `2.9` — so
  // handing the value straight back is what makes "everything else is
  // byte-identical" a fact rather than a hope. The parameter is typed `number`
  // because callers declare it so; the value arrives from untyped JSON
  // metadata.
  const refused = Number.isInteger(declared) && declared > PERCENT_SCALE_CEILING;
  if (!refused) return declared;
  const key = `${face}|${declared}`;
  if (!warnedScales.has(key)) {
    warnedScales.add(key);
    console.warn(
      `[ObjectUI] ${face}: a declared \`scale\` of ${declared} is above the ` +
        `${PERCENT_SCALE_CEILING}-digit fraction width this platform can render; ` +
        `rendering at ${PERCENT_SCALE_CEILING} instead (${card}).`,
    );
  }
  return PERCENT_SCALE_CEILING;
}
