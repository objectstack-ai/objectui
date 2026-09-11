/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The ONE rule the `summaryFields` chip scales a stored `percent` by
 * (objectui#8728).
 *
 * ## The defect this function exists to make impossible
 *
 * The chip beside the record H1 draws a percent TWICE — as its text and as a
 * small bar — and the two halves scaled the same stored number by two
 * different rules:
 *
 *     display = `${num}%`;                            // the text: no scaling
 *     const normalized = num <= 1 ? num * 100 : num;  // the bar: ratio, scaled
 *
 * so a stored `0.123` labelled itself `0.123%` beside a bar filled to 12.3%.
 * One control, two percentages, and neither half told the reader which one was
 * right. Both halves now read this function — which is why it is a named
 * function and not the same ternary written twice. The next reader cannot
 * re-desynchronise them without deleting a call site.
 *
 * ## Which of the two rules survived, and why it is the BAR's
 *
 * Triage's ruling on objectui#8728: the text follows the bar, ⛔ never the
 * reverse, and ⛔ never a third rule invented for the occasion. So every bar
 * this chip has ever drawn is preserved here — a stored `12.3` still reads
 * `12.3%` beside a bar at 12.3%, a stored `250` still reads `250%` beside a
 * full one. What moved is the text, which now states the number the bar was
 * already drawing.
 *
 * ## ⚠️ This is NOT the repo's percent rule — measured, and filed
 *
 * The census that ruling asked for says the bar's `num <= 1` is the only
 * spelling of its kind in the tree. `percentDisplayValue` in `@object-ui/core`
 * — whose doc comment calls itself the single source of truth for percent
 * display scaling, and requires any third surface to take BOTH halves from it,
 * the scaling AND the convention — uses the symmetric `value > -1 && value < 1`,
 * and the list cell (`formatPercent`), the dashboard measure and the grid
 * column summary all reach it. Two consequences, both RECORDED on
 * objectui#9071 rather than decided here:
 *
 *  - exactly `1` scales to `100` here and renders `1%` in every other band.
 *    objectui#5607 pinned that boundary in words for `plugin-dashboard` — 1 is
 *    percentage points, the convention `PercentScale` spells as `whole` — when
 *    it removed this same drift shape one package over;
 *  - a stored value at or below -1 now reads `-500%` for a stored `-5`, where
 *    the text alone used to read `-5%`. The bar is unchanged either way (any
 *    negative clamps to an empty track), so this is the drift becoming visible
 *    on the half that had been accidentally right.
 *
 * Converging the chip onto `percentDisplayValue` — or onto the field's declared
 * scale, which is what the edit widget `PercentField` reads instead of guessing
 * from magnitude — is objectui#9071's decision to make, not this one's.
 */
export function summaryChipPercentPoints(raw: number): number {
  // Already in percentage points: passed through untouched, so every value the
  // chip renders correctly today is byte-identical after the repair.
  if (raw > 1) return raw;

  // A ratio, scaled to points. The `toPrecision` is load-bearing, not
  // defensive: `raw * 100` is binary floating-point multiplication, and it is
  // now the TEXT that reads the result. 246 of the 999 three-decimal ratios
  // (0.001 through 0.999) carry residue when multiplied by 100 — a stored
  // `0.07` is `7.000000000000001`, a stored `0.29` is `28.999999999999996` —
  // which a CSS bar width absorbs invisibly and a label cannot. 12 significant
  // digits is far wider than any percent a human authored, and far narrower
  // than the residue.
  return Number((raw * 100).toPrecision(12));
}
