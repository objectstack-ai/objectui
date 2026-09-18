import React from 'react';
import { Input, Slider, EmptyValue, cn } from '@object-ui/components';
import { FieldWidgetComponentProps } from './types.js';
import { toDomProps } from './toDomProps.js';
import { useBadInputRefusal, BadInputMessage, BAD_INPUT_BORDER } from './numberBadInput.js';

/**
 * The widest fraction the two percent faces can actually render.
 *
 * ⛔ NOT a number this renderer picked. It is the domain both formatting APIs
 * this package reaches for define for themselves, and they define the SAME
 * one — which is what makes a single ruling over both faces possible at all.
 * Re-measured on this container's node (v22.22.2), the two APIs and the two
 * ends:
 *
 * ```
 * (25).toFixed(100)                                        -> "25.000…"
 * (25).toFixed(101)                                        -> RangeError
 * (25).toFixed(-1)                                         -> RangeError
 * new Intl.NumberFormat('en', { maximumFractionDigits: 100 })  -> ok
 * new Intl.NumberFormat('en', { maximumFractionDigits: 101 })  -> RangeError
 * ```
 *
 * ⚠️ Re-measure rather than trust this comment if it ever matters again: the
 * bound is a RUNTIME property of the engine (ECMA-262 `Number.prototype.
 * toFixed` and ECMA-402 `SetNumberFormatDigitOptions` each state it), ⛔ not a
 * constant this repository owns.
 */
export const PERCENT_SCALE_CEILING = 100;

/** Declared widths already reported, so a 1,000-row grid warns once. */
const warnedPercentScales = new Set<number>();

/**
 * ONE ruling over BOTH percent faces (objectui#9808): a declared `scale`
 * outside the renderable domain is CLAMPED into it and REPORTED — ⛔ never
 * carried into a formatter that throws.
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
 * that they did. ⇒ 0 and {@link PERCENT_SCALE_CEILING} are not policy numbers
 * this package chose; they are the formatters' own domain, reported as such.
 *
 * ── The reporting half ──────────────────────────────────────────────────
 * The clamp alone would be the silent guess the card refuses, so a moved width
 * always emits a `console.warn` naming the declared value, the width actually
 * rendered and this card. Deduplicated by declared value, because a percent
 * COLUMN re-renders per row and an undeduplicated warning would bury the one
 * line that matters.
 *
 * ── In-range declarations are untouched, and that is load-bearing ───────
 * The test is whether the ENGINE could have rendered the width, ⛔ not whether
 * this function changed its spelling. Every width both formatters already
 * accept comes back with the same rendered result and emits nothing — inside
 * the domain `Math.min`/`Math.max` return the argument itself, and the two
 * coercions the engines perform for themselves are preserved rather than
 * second-guessed (measured: `(25).toFixed('2')` and
 * `maximumFractionDigits: '2'` render two decimals, and so does `2.9`). A
 * change that moved ordinary percent fields would be a different card. A width
 * no engine can use — non-finite, or outside the domain — resolves into the
 * domain and is reported.
 *
 * ⛔ This says nothing about which MEMBER a face reads, nor about what an
 * ABSENT `scale` means — the two faces still spell that absence differently
 * (this widget 2, `PercentCellRenderer` 0) and objectui#9810 holds the
 * question of what `scale` means to the write path versus the display path.
 * Neither is touched here: this function only sees a width a face has already
 * resolved.
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

/**
 * PercentField - Percentage input whose decimal places follow the field's
 * declared `scale` (see the read below)
 * Stores values as decimals (0-1) and displays as percentages (0-100%)
 * Includes a slider for interactive control.
 */
export function PercentField({ value, onChange, field, readonly, error, className, ...props }: FieldWidgetComponentProps<number>) {
  const percentField = field as any;
  /**
   * Decimal places come from `scale`, NOT `precision` (objectui#9568) — the
   * correction `NumberField` in this directory already carries, and the one
   * objectui#9295 made on the read-only cell, the grid summary footer and the
   * detail summary chip. This widget is the face that did not move.
   *
   * `@objectstack/spec` declares the pair on the field face in its own words:
   * `precision` is "Total digits (non-negative integer)" and `scale` is
   * "Decimal places (non-negative integer)". Reading `precision` padded every
   * value out to the column's TOTAL width, so a decimal(10, 2) percent field
   * rendered `25.0000000000%` and offered a `1e-10` step — a step that is not
   * a cosmetic defect but an unusable control for the value it is declared to
   * edit.
   *
   * ⛔ NOT `CurrencyConfigSchema.precision`, which is a different surface with
   * the opposite convention and its own `scale` alias; the spec warns against
   * conflating the two at the field-face declaration itself. And ⛔ not
   * `CurrencyField`'s read of `precision` either: there the competing source is
   * the currency's own ISO 4217 minor-unit count, and objectui#4361 ruled an
   * authored `precision` wins over THAT. It ruled nothing about `scale`, which
   * a currency field's face does not carry a meaning for, and it pushed the
   * contract question upstream rather than settling it here.
   *
   * `typeof`, not truthiness: `scale: 0` is a valid declaration (a percent
   * field that edits whole percents) and `||` would silently drop it — the
   * reason `NumberField` guards its own read the same way, and the guard the
   * `max` read below already uses. `??` would keep a `0` too, but it also
   * keeps a `scale: "2"` arriving from JSON metadata, and inventing a width
   * from a string is the consumer-side guessing AGENTS.md #0.1 refuses.
   *
   * An ABSENT `scale` keeps this widget's own 2. The repair moves the MEMBER
   * that is read and nothing else, so it is invisible to every percent field
   * that declares neither member. ⚠️ Stated rather than papered over: that
   * leaves this widget and `PercentCellRenderer` still disagreeing when
   * nothing is declared — the cell spells the same absence `0` and pins it —
   * which is a disagreement objectui#9568 explicitly declines to make a
   * premise and this change neither widens nor closes. Whether the two faces
   * should agree at all needs its own ruling, not a side effect of this one.
   */
  const declaredScale = percentField?.scale;
  // The width this face resolves, then the ONE out-of-range ruling both faces
  // take (objectui#9808) — see `renderablePercentScale` above for why a width
  // the engine cannot render is clamped and reported rather than refused, and
  // for why this leaves an in-range declaration byte-identical.
  const scale = renderablePercentScale(typeof declaredScale === 'number' ? declaredScale : 2);

  // Before the readonly return below: hooks are unconditional (objectui#6780).
  const { refusal, readBadInput } = useBadInputRefusal('12.5');

  // Convention detection. A field declaring `max > 1` (e.g. `max: 100`) stores
  // WHOLE-NUMBER percents (0–100); otherwise values are FRACTIONS (0–1) shown
  // as 0–100%. This matches the read-side formatter so the edit widget agrees
  // with display — and, crucially, keeps the rendered <input> within its `max`
  // (a whole-number 50 must show "50", not "5000", or HTML5 constraint
  // validation marks the field `:invalid` and blocks the whole form's submit).
  const maxAttr = typeof percentField?.max === 'number' ? (percentField.max as number) : undefined;
  const whole = maxAttr != null && maxAttr > 1;
  const toDisplay = (v: number) => (whole ? v : v * 100);
  const fromDisplay = (n: number) => (whole ? n : n / 100);
  const sliderMax = whole ? maxAttr! : 100;

  if (readonly) {
    if (value == null) return <EmptyValue />;
    return (
      <span className="text-sm font-medium tabular-nums">
        {toDisplay(value).toFixed(scale)}%
      </span>
    );
  }

  // Convert between stored value and 0–100 display value
  const displayValue = value != null ? toDisplay(value) : '';
  const sliderValue = value != null ? toDisplay(value) : 0;

  /**
   * ⚠️ What `e.target.value` can actually hold here — MEASURED in a real
   * browser, not inferred from the spec (objectui#6765).
   *
   * The bare `parseFloat` below has no whole-string guard of its own, and that
   * is deliberate rather than objectui#6715's defect repeated. This is a
   * `type="number"` input, and a real browser never exposes non-numeric
   * residue through `.value` — keystrokes and pastes are filtered before the
   * change event fires.
   *
   * Measured on Chromium 141.0.7390.37 (Playwright 1.62.1), driving THIS
   * widget (fraction convention, a two-decimal width):
   *
   * ```
   * typed  "12abc" -> box.value "12"    onChange(0.12)
   * typed  "1.2.3" -> box.value "1.23"  onChange(0.0123)
   * pasted "0x10"  -> box.value "010"   onChange(0.1)
   * typed  "1e"    -> box.value ""      onChange(null)   validity.badInput
   * ```
   *
   * ⛔ objectui#6715's anchored `WHOLE_NUMBER_TEXT` is deliberately NOT copied
   * here: it accepts every string this box can produce and rejects only
   * strings the TEST environment fabricates, because happy-dom does not
   * implement the sanitization. See the fuller note in `CurrencyField.tsx`,
   * and the pinned oracle-vs-product table in
   * `__tests__/NumberInputWidgets.environmentDivergence.test.tsx`.
   *
   * ⭐ CLOSED for the last row (objectui#6780, ruled 2026-08-29): the silent
   * drop is ANNOUNCED, via the platform's own `validity.badInput`, across all
   * four `type="number"` widgets of this package as one change. The measurement
   * and the reason the EMISSION is unchanged live in `numberBadInput.tsx`.
   *
   * ⛔ STILL SILENT, deliberately: the TRUNCATING rows above (`1.2.3` stores
   * `0.0123`, `0x10` stores `0.1`). The browser filtered those keystrokes
   * before this handler ran, so no widget-side guard can refuse them. Written
   * down for users in `content/docs/guide/fields.md`, because a control that
   * warns about `1e` while silently truncating `1.2.3` teaches people that no
   * warning means the value is right.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    readBadInput(e.target);
    if (e.target.value === '') {
      onChange(null as any);
      return;
    }
    const parsed = parseFloat(e.target.value);
    const val = isNaN(parsed) ? null : fromDisplay(parsed);
    onChange(val as any);
  };

  /**
   * The blur arm objectui#6780 adds — this widget had no `onBlur` at all.
   *
   * Needed because React delivers no `onChange` when `.value` never leaves
   * `''`, which is the measured shape of PASTING `1e` into an empty box: one
   * DOM `input` event fires, React's input-value tracking suppresses the
   * synthetic change, and `badInput` is still true at blur time.
   *
   * ⚠️ It COMPOSES the host's `onBlur` instead of replacing it. `onBlur` is a
   * declared DOM pass-through key (`FieldWidgetDomProps`), so `toDomProps`
   * already delivers it here; a bare `onBlur={...}` written after that spread
   * would silently drop a key the contract promises — this package's
   * DECLARED-BUT-NOT-DELIVERED class (objectui#3290 / objectui#3222).
   */
  const domProps = toDomProps(props);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    readBadInput(e.target);
    domProps.onBlur?.(e);
  };

  const handleSliderChange = (values: number[]) => {
    if (readonly || props.disabled) return;
    if (!Array.isArray(values) || values.length === 0) {
      onChange(null as any);
      return;
    }
    const raw = values[0];
    const nextValue = typeof raw === 'number' ? fromDisplay(raw) : null;
    onChange(nextValue as any);
  };

  // Derive the slider step from the SAME `scale` the input and the readonly
  // face take, so slider granularity matches the input and neither offers a
  // value the other would round away (objectui#9568 kept the two tied on
  // purpose — the decision is one member, read once).
  const sliderStep = Math.pow(10, -scale);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...domProps}
          type="number"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={percentField?.placeholder || '0'}
          disabled={readonly || props.disabled}
          className={cn('pr-8', refusal ? BAD_INPUT_BORDER : '', className)}
          step={Math.pow(10, -scale).toFixed(scale)}
          // `refusal` is this widget's OWN reading, which no host can produce;
          // `error` keeps its single author (objectui#3222 / objectui#6716).
          aria-invalid={!!error || !!refusal}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          %
        </span>
      </div>
      <BadInputMessage refusal={refusal} />
      <Slider
        value={[sliderValue]}
        onValueChange={handleSliderChange}
        min={0}
        max={sliderMax}
        step={sliderStep}
        disabled={readonly || props.disabled}
        className="w-full"
        aria-label="Percentage"
        data-testid="percent-slider"
      />
    </div>
  );
}
