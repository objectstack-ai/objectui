import React from 'react';
import { Input, Slider, EmptyValue, cn } from '@object-ui/components';
import { FieldWidgetComponentProps } from './types.js';
import { toDomProps } from './toDomProps.js';
import { useBadInputRefusal, BadInputMessage, BAD_INPUT_BORDER } from './numberBadInput.js';
// The ONE out-of-range `scale` ruling both percent faces take (objectui#9808),
// in its own module so the barrel can share the same spelling without
// publishing it — see that module's header for the ruling and its sunset.
import { renderablePercentScale } from './percent-scale.js';

/**
 * The stored fraction a typed percentage-point value becomes — computed by
 * shifting the DECIMAL point two places, ⛔ never by dividing a binary float
 * by 100 (objectui#9810).
 *
 * Maintainer ruling, batch #161 item 3, letter B — the operative clause,
 * quoted rather than paraphrased:
 *
 * > `scale` on a `percent` field means the DISPLAYED percentage-point
 * > decimals — the landed objectui#9295 convention; the storage side derives:
 * > for a fraction-stored percent (`percentScaleOf` = `fraction`) the objectql
 * > record validator's `max_scale` branch allows `scale + 2` decimal places in
 * > the stored fraction
 *
 * ⇒ the derivation is a CONTRACT this widget has to be able to meet: the
 * platform refuses (never rounds) a written value carrying more decimal places
 * than the declaration allows, and for a fraction-stored percent that
 * allowance is exactly `scale + 2`. `n / 100` cannot meet it. Division by 100
 * is not representable in binary floating point, so the quotient carries
 * residue that no author typed: measured over the whole step grid a `scale: 2`
 * field offers (`0.00` … `100.00`, 10001 values), 2760 of them — 27.6% —
 * convert to a stored fraction of 16 to 19 decimal places. Ordinary ones:
 * `66.67` stores `0.6667000000000001`, `99.99` stores `0.9998999999999999`,
 * `29.97` stores `0.29969999999999997`. Each is a value the widget's OWN
 * `step` attribute offers and the write path then refuses — the affordance
 * objectui#9810 was filed about, surviving the ruling on the limb the ruling
 * settled in this widget's favour.
 *
 * Shifting the decimal exponent instead is EXACT in the sense that matters
 * here: the result is the double nearest the decimal value the author typed,
 * so a display value carrying `d` decimal places stores `d + 2` and no more.
 * ⛔ It is not a rounding and it alters nothing: an author who types finer than
 * the declared width (`12.345` into a `scale: 2` field) still stores
 * `0.12345` and is still refused upstream, which is the ruled behaviour —
 * `max_scale` is enforced by REJECTION, and a widget-side rounding here would
 * convert that refusal into the silent data alteration the platform ruled out.
 *
 * The `whole` arm keeps its identity conversion for the same reason: there the
 * typed number IS the stored number, so there is no arithmetic of ours to
 * correct.
 */
const storedFraction = (displayValue: number): number => {
  // `Number.isFinite` first: `String(NaN)` / `String(Infinity)` produce no
  // exponent to shift, and the callers below treat a non-finite reading as the
  // empty value rather than as a number to convert.
  if (!Number.isFinite(displayValue)) return displayValue;
  // `String(1e-7)` is already exponential, so the exponent is ADDED to the
  // existing one rather than appended (`1e-7` ⇒ `1e-9`, never `1e-7e-2`).
  const [mantissa, exponent] = String(displayValue).split('e');
  return Number(`${mantissa}e${exponent ? Number(exponent) - 2 : -2}`);
};

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
   * `CurrencyField`'s width either: a currency's decimal places are the
   * currency's own ISO 4217 minor-unit count, and that widget reads neither
   * `precision` nor `scale` for them (objectui#10276).
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
  // take (objectui#9808) — see `./percent-scale.js` for why a width the engine
  // cannot render is clamped and reported rather than refused, why it leaves a
  // width the engine already accepts byte-identical, and the SUNSET condition
  // that retires the whole clamp.
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
  // ⛔ NOT `n / 100` — see `storedFraction` above: the quotient's binary
  // residue overflows the `scale + 2` stored width ruling B derives, for 27.6%
  // of the values this widget's own step offers (objectui#9810).
  const fromDisplay = (n: number) => (whole ? n : storedFraction(n));
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
