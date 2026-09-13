// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#9318 — the wrong-layer verdict comes from `@objectstack/lint`, not
 * from a second hand-maintained copy of it.
 *
 * ## What moved
 *
 * `rowCanonAdvisory` used to answer "is this root bound on this surface?" from
 * objectui's own knowledge: `@object-ui/core`'s `detectNonCanonicalRowSpelling`
 * hard-codes ONE root (`data`) and objectui's docblock justified that from
 * `ROW_PREDICATE_ROOTS` / `FIELD_RULE_ROOTS` / `FORMULA_ROOTS`. The platform
 * publishes the same judgement as `fieldRuleRootIssue` / `FIELD_RULE_BOUND_ROOTS`.
 * Two copies of one judgement agree today and nothing keeps them agreeing.
 *
 * ## What did NOT move, and is pinned here as such
 *
 * The helper's vocabulary is the FIELD-RULE tier: it judges against
 * `FIELD_RULE_BOUND_ROOTS` = `record` / `previous` / `parent`. Two of the
 * surfaces `rowCanonAdvisory` guards bind a DIFFERENT set, measured:
 *
 *  - the conditional-formatting `condition` binds `ROW_PREDICATE_ROOTS`
 *    (`record`, `current_user`, `user`, `features`, `os`, `ctx`) — WIDER;
 *  - a `formula` field's `expression` binds `FORMULA_ROOTS` (`record`) — NARROWER.
 *
 * So the helper's verdict is adopted exactly on the three slots whose bound set
 * IS the field-rule set, and the local fallback is KEPT for the rest. The two
 * "uncovered surface" pins below are live controls for the failure this card
 * exists to stop, in miniature: routing every surface through the helper to
 * make the code tidier would redden them.
 *
 * Severity stays objectui's own mapping (`warning`, never `error`) on both
 * paths — every save gate on this tier counts `severity === 'error'`.
 */

import { describe, it, expect } from 'vitest';
import { fieldRuleRootIssue, FIELD_RULE_BOUND_ROOTS } from '@objectstack/lint';
import { lintCelPredicate } from './celAuthoring';

const HINT = { objectName: 'account', fields: ['organization_id', 'owner_id', 'status', 'amount'] };
/** A field conditional rule — a slot the published helper's vocabulary covers. */
const RULE_SLOT_HINT = { ...HINT, scope: 'record' as const, slot: 'visibleWhen' as const };
/** The same tier with no slot named — the local fallback, unchanged. */
const UNSLOTTED_HINT = { ...HINT, scope: 'record' as const };

/** objectui's own advisory sentence; the engine's never contains it. */
const OBJECTUI_MESSAGE_MARKER = /Re-root/;

describe('celAuthoring · the field-rule verdict is the published one (objectui#9318)', () => {
  it('TRUE POSITIVE — a covered slot takes BOTH the verdict and the message from `fieldRuleRootIssue`', async () => {
    const source = "data.status == 'x'";
    const issues = await lintCelPredicate(source, RULE_SLOT_HINT);
    const engine = fieldRuleRootIssue('visibleWhen', source);
    // The helper has something to say about this source — if it ever stops,
    // this pin is measuring nothing and must be re-derived, not relaxed.
    expect(engine).not.toBeNull();
    const advisory = issues.filter((i) => i.severity === 'warning' && i.message === engine!.message);
    // Verbatim equality against the helper's OWN output, evaluated here rather
    // than transcribed: this asserts "objectui ships the engine's message" and
    // can never drift with upstream wording the way a quoted string would.
    expect(advisory).toHaveLength(1);
  });

  it('ships ONE message, never both — objectui\'s sentence is gone from the covered path', async () => {
    const issues = await lintCelPredicate("data.status == 'x'", RULE_SLOT_HINT);
    expect(issues.filter((i) => OBJECTUI_MESSAGE_MARKER.test(i.message))).toEqual([]);
    expect(issues.filter((i) => i.severity === 'warning')).toHaveLength(1);
  });

  it('LIVE CONTROL — the ACCEPT SET is not narrowed: the covered path raises no error', async () => {
    // Every save gate on this tier counts `severity === 'error'` and nothing
    // else, so "zero errors" IS "still accepted". Reddens on exactly one
    // change — promoting the advisory to `error`.
    const issues = await lintCelPredicate("data.status == 'x'", RULE_SLOT_HINT);
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('a root the platform DOES bind comes back clean THROUGH the new path', async () => {
    // The ablation target: `previous` and `parent` are clean here because
    // `FIELD_RULE_BOUND_ROOTS` says the field level binds them, not because
    // objectui's detector only ever looked at `data`.
    expect(await lintCelPredicate("previous.status == 'x'", RULE_SLOT_HINT)).toEqual([]);
    expect(await lintCelPredicate('parent.status == "paid"', RULE_SLOT_HINT)).toEqual([]);
    expect(await lintCelPredicate("record.status == 'x'", RULE_SLOT_HINT)).toEqual([]);
  });

  it('takes the WIDER verdict on a covered slot: a root no field rule binds is advised too', async () => {
    // A declared behaviour change, and the substance of adopting the published
    // verdict: `current_user` is in the engine's baseline `SCOPE_ROOTS`, so
    // `validateExpression` says nothing about it, while the FIELD level does
    // not bind it. objectui's one-root detector could never reach this.
    const issues = await lintCelPredicate('current_user.isAdmin', RULE_SLOT_HINT);
    const advisory = issues.filter((i) => i.severity === 'warning' && /current_user/.test(i.message));
    expect(advisory).toHaveLength(1);
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('stands down on a parse error and on a non-CEL dialect, like the path it replaces', async () => {
    const broken = await lintCelPredicate('data.status ==', RULE_SLOT_HINT);
    expect(broken.some((i) => i.severity === 'error')).toBe(true);
    expect(broken.filter((i) => i.severity === 'warning' && /\bdata\b/.test(i.message))).toEqual([]);
    const legacy = await lintCelPredicate('${data.status}', RULE_SLOT_HINT);
    expect(legacy.filter((i) => i.severity === 'warning' && /\bdata\b/.test(i.message))).toEqual([]);
  });
});

describe('celAuthoring · the UNCOVERED surfaces keep the local fallback (objectui#9318 part 3)', () => {
  it('LIVE CONTROL — a formula `expression` still gets objectui\'s message, not the engine\'s', async () => {
    // `FORMULA_ROOTS` is `['record']` — NARROWER than `FIELD_RULE_BOUND_ROOTS`.
    // Routing this through the helper would silently stop advising `previous.*`
    // / `parent.*` on a surface that binds neither.
    const issues = await lintCelPredicate('data.amount * 0.2', { ...UNSLOTTED_HINT, role: 'value' as const });
    const advisory = issues.filter((i) => i.severity === 'warning' && OBJECTUI_MESSAGE_MARKER.test(i.message));
    expect(advisory).toHaveLength(1);
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('LIVE CONTROL — a conditional-formatting condition is NOT advised for the roots it binds', async () => {
    // `ROW_PREDICATE_ROOTS` carries `current_user`, `user`, `features`, `os`,
    // `ctx` — WIDER than `FIELD_RULE_BOUND_ROOTS`. This is the pin that reddens
    // if someone routes every `scope: 'record'` surface through the helper:
    // the author would be told to rewrite a predicate that works.
    expect(await lintCelPredicate('current_user.isAdmin', UNSLOTTED_HINT)).toEqual([]);
    expect(await lintCelPredicate("os.name == 'x'", UNSLOTTED_HINT)).toEqual([]);
  });

  it('an unknown slot name falls back rather than guessing', async () => {
    const issues = await lintCelPredicate('current_user.isAdmin', { ...UNSLOTTED_HINT, slot: 'someFutureWhen' });
    expect(issues).toEqual([]);
  });
});

describe('celAuthoring · platform drift tripwire (objectui#9318)', () => {
  it('the published bound set is still the one objectui measured its coverage answer against', async () => {
    // NOT a second copy of the verdict — the verdict is read from the helper at
    // runtime and this assertion is never consulted by product code. It exists
    // so that the next root the platform binds or unbinds arrives as a RED test
    // in objectui, with the instruction to re-derive which of this repo's
    // surfaces the helper's vocabulary still covers (PR objectui#9318 part 3).
    expect([...FIELD_RULE_BOUND_ROOTS]).toEqual(['record', 'previous', 'parent']);
  });
});
