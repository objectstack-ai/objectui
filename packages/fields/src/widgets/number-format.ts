/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The ONE formatting call every display face of a `number` field makes:
 * `NumberCellRenderer` in a table, and `NumberField`'s read-only branch in a
 * form (objectui#11431).
 *
 * The read-only branch used to print the raw stored value, so a field
 * declaring `scale: 2` and holding `1234.5` read `1234.5` in a read-only form
 * and `1,234.50` in its table cell. A second copy of the cell's assembly next
 * to the widget would agree only until one of the two moved, so the assembly
 * lives here and both faces call it: they agree by construction.
 *
 * Deliberately pure, with no React and no component imports, for the reason
 * `address-format.ts` gives: the eager `@object-ui/fields` barrel calls it for
 * cell rendering, the lazily loaded widget calls it for its read-only face, and
 * neither may import the other (the widget importing the barrel would be a
 * runtime cycle and would pull it out of its chunk).
 */

import type { FieldMetadata } from '@object-ui/types';
import { resolveFieldScale } from '@objectstack/spec/data';
import { formatDisplayNumber } from '@object-ui/i18n';

/**
 * Format a numeric value the way the `number` field declaring it says to
 * display it.
 *
 * @param value  the numeric value. Callers decide what counts as empty or as
 *               not a number before calling: this formats a number, it does
 *               not judge one.
 * @param field  the field metadata; its `type`, `scale` and `useGrouping` are
 *               the inputs read.
 * @param locale the display locale tag, from `useDisplayLocale()`.
 */
export function formatNumberFieldValue(value: number, field: FieldMetadata, locale: string): string {
  // Decimal places come from `scale` (the `s` in a `decimal(p, s)` column),
  // NOT `precision`: `precision` is the TOTAL digit count (`p`), and reading
  // it padded every value out to that width (e.g. `1` from a decimal(10, 0)
  // column rendered as "1.0000000000"). When `scale` is declared the value is
  // padded to it so a fixed display is honoured (e.g. an amount with scale 2
  // reads "16.00", a field with scale 3 reads "3.140"); when it is absent the
  // minimum stays at 0 so trailing zeros are trimmed, and only the maximum is
  // capped (20 = Intl max) to preserve the value's natural precision.
  //
  // `scale` is also the grouping POLICY input (objectui#4033): a declared
  // `scale: 0` with no currency is a discrete integer (a year, a fiscal period,
  // an ordinal), and those are rendered ungrouped, so a `Field.number` year
  // shows `2026` instead of `2,026`. An ABSENT scale keeps grouping: absent
  // means "decimals unknown", not "integer". The policy and its interim status
  // live in `formatDisplayNumber`, not here.
  //
  // No clamp: the objectui#10071 one retired at the objectui#9808 SUNSET
  // (objectui#11073), since `@objectstack/spec` 17.5.0 refuses a `scale` above
  // 100.
  //
  // objectui#11254: the width is read through `resolveFieldScale` (ruling A′
  // on objectstack-ai/objectstack#19628), the function the percent cell, the
  // detail chip, the grid footer and the gantt tooltip ask. For `number` the
  // protocol has no absent-`scale` row, so an undeclared field answers
  // `undefined`: no fixed width. A malformed declaration that is still a JS
  // number (`1.5`, `-1`) is "no declaration" too, because the resolver's door
  // is the record validator's own (`Number.isInteger` and `>= 0`); before,
  // `1.5` reached `Intl` to be floored to a width nobody declared and `-1`
  // reached it to throw. The resolved value feeds the grouping policy exactly
  // as the raw one did: a declared `0` stays `0`.
  // ⛔ No `?? N` beside this call: `undefined` is the protocol's answer.
  const scale = resolveFieldScale({ type: field.type, scale: 'scale' in field ? field.scale : undefined });
  // The author's digit-grouping hint (objectui#11026): `FieldSchema.useGrouping`,
  // declared on `NumberFieldMetadata`, read off the typed `field`. An authored
  // boolean overrides the `scale` heuristic above in either direction; the
  // decision is `formatDisplayNumber`'s, this only hands the declaration over.
  // Booleans only: the spec's door refuses anything else, and a value that is
  // not one is not a declaration.
  const useGrouping =
    'useGrouping' in field && typeof field.useGrouping === 'boolean'
      ? field.useGrouping
      : undefined;
  // Two arms, spelled out: a resolved width is fixed at both bounds; no width
  // is the value's natural precision (the minimum 0 / maximum 20 described
  // above), which is not a width of its own.
  return formatDisplayNumber(value, {
    locale,
    scale,
    useGrouping,
    ...(scale === undefined
      ? { minimumFractionDigits: 0, maximumFractionDigits: 20 }
      : { minimumFractionDigits: scale, maximumFractionDigits: scale }),
  });
}
