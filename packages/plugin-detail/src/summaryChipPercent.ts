/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { percentDisplayValue } from '@object-ui/core';

/**
 * The ONE rule the `summaryFields` chip scales a stored `percent` by — and it
 * is the repo's, not this file's (objectui#9071).
 *
 * ## Why this function exists at all (objectui#8728)
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
 * right. Both halves read this function — which is why it is a named function
 * and not the same ternary written twice. The next reader cannot
 * re-desynchronise them without deleting a call site.
 *
 * ## What objectui#9071 DELETED, and why aligning it would not have done
 *
 * objectui#8728 converged the chip's two halves onto the BAR's rule and
 * recorded, rather than decided, that the rule was the chip's own. The census
 * it asked for answered the question: the predicate that stood here —
 * a pass-through spelled `if (raw > 1) return raw;`, i.e. the bar's original
 * `num <= 1` written the other way round — was the only spelling of its kind on
 * this side of the tree, and it disagreed with the declared single source of
 * truth at EXACTLY 1 and at every value AT OR BELOW -1:
 *
 * | stored | the deleted local rule | `percentDisplayValue`, and every other band |
 * |--------|------------------------|---------------------------------------------|
 * | `0.25` | `25%`                  | `25%`   (the band they always agreed on)     |
 * | `1`    | `100%`                 | `1%`                                         |
 * | `-1`   | `-100%`                | `-1%`                                        |
 * | `-5`   | `-500%`                | `-5%`                                        |
 *
 * ⛔ The repair is NOT to move the local predicate's boundary onto the shared
 * one. That would leave two rules agreeing by coincidence — the same shape
 * objectui#5607 removed one package over, and the shape that produced this
 * drift in the first place. The predicate is gone; the authority is
 * {@link percentDisplayValue} in `@object-ui/core`, whose own doc comment
 * requires exactly this of a third surface, and which the list cell
 * (`formatPercent` / `PercentCellRenderer`), the dashboard measure
 * (`formatMeasure`) and the grid column summary already read.
 *
 * ## ⚠️ The half objectui#9071 did NOT take, stated rather than left silent
 *
 * That doc comment asks a third surface for BOTH halves — the scaling AND the
 * convention. Only the SCALING moved here. The chip states the full number with
 * a bare `%`; the list cell renders through the locale's percent affix at the
 * field's precision, which is `0` by default. So a stored `12.3` still reads
 * `12.3%` on the chip and `12%` in the cell — two spellings of one magnitude,
 * and the two bars prove the magnitude is one. Taking the convention half would
 * move values the chip renders correctly today, which objectui#9071's
 * acceptance forbids; it is pinned as a fact in
 * `__tests__/summaryChip.percentSource-9071.test.tsx` so the next card inherits
 * a measurement instead of a silence.
 */
export function summaryChipPercentPoints(raw: number): number {
  const points = percentDisplayValue(raw);

  // Not a second rule, and not a boundary: this asks the SOURCE whether it
  // scaled, by comparing its answer to its input, so it cannot drift away from
  // whatever `percentDisplayValue` decides.
  if (points === raw) return points;

  // A ratio the source scaled to points. The `toPrecision` is load-bearing, not
  // defensive: `raw * 100` is binary floating-point multiplication, and it is
  // the TEXT that reads the result. 246 of the 999 three-decimal ratios
  // (0.001 through 0.999) carry residue when multiplied by 100 — a stored
  // `0.07` is `7.000000000000001`, a stored `0.29` is `28.999999999999996` —
  // which a CSS bar width absorbs invisibly and a label cannot. 12 significant
  // digits is far wider than any percent a human authored, and far narrower
  // than the residue. It rounds a MAGNITUDE the source already chose, so it is
  // a rendering step on this chip's text path, not a percent convention: the
  // guard above keeps it off every value the source passed through, where
  // trimming to 12 digits would move numbers that render correctly today.
  return Number(points.toPrecision(12));
}
