/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The three `@object-ui/plugin-ai` node declarations stop offering members no
 * runtime honours, on BOTH faces (objectui#10874).
 *
 * ## The defect these pin
 *
 * `AIFormAssistSchema`, `AIRecommendationsSchema` and `NLQuerySchema` (`../ai.ts`)
 * offered an author two kinds of member that nothing honoured:
 *
 *   - five `on*` members typed `string` — `onApplySuggestion`,
 *     `onRejectSuggestion`, `onSelect`, `onDismiss`, `onSubmit` — the
 *     handler-expression dialect objectui#6182 withdrew on either face. The zod
 *     arms objectui#10859 wrote refuse all five by name (`handlerKeyRefusal`), so
 *     `onSelect: 'x'` passed `tsc` and was refused by `safeValidateSchema`: the
 *     two faces disagreed by design;
 *   - `config` (all three) and `context` (two of them), read by nothing in
 *     `@object-ui/plugin-ai` — the components are presentation only and call no
 *     model — and accepted by BOTH faces, so a `config: { … }` passed `tsc`,
 *     parsed green and changed nothing.
 *
 * The triage ruling on objectui#10874 settled the direction: the `on*` members
 * leave the node (a callback is a React prop of the component, not a member of
 * the document), and `config` / `context` retire on both faces with a refusal
 * that says what to do instead — configure AI on the provider, pass handlers as
 * component props.
 *
 * ## Two instruments, and which half each one reads
 *
 * The `Expect` / `Equal` aliases and the `@ts-expect-error` directives are
 * TYPE-level: `tsc -p tsconfig.test.json` (the third leg of this package's
 * `type-check` script) reads them, and a re-widened member fails there — on an
 * unused directive or on a `false` row. vitest strips types and reads none of
 * it. The `safeValidateSchema` / `StrictAnyComponentSchema` rows are RUNTIME and
 * vitest reads them. A green run of either one alone says nothing about the
 * other.
 *
 * The runtime refusal of the five `on*` members is not re-pinned here: it
 * predates this card and is `ai-zod-arms-10859.test.ts`'s, beside this file,
 * whose `assertionHandlerFacesAgree` pins both faces of all five together.
 */

import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import {
  AIFormAssistSchema,
  AIRecommendationsSchema,
  NLQuerySchema,
  StrictAnyComponentSchema,
  safeValidateSchema,
} from '../zod/index.zod.js';
import type {
  AIFieldSuggestion,
  AIFormAssistSchema as Ts_AIFormAssistSchema,
  AIRecommendationItem,
  AIRecommendationsSchema as Ts_AIRecommendationsSchema,
  NLQueryResult,
  NLQuerySchema as Ts_NLQuerySchema,
} from '../ai';

/* ── Type-level pins: the `tsc` channel ────────────────────────────────────── */

/** Invariant equality — `extends` both ways would accept a narrowing. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type ShapeOf<M> = M extends { shape: infer S } ? S : never;
type InputOf<T> = T extends z.ZodType ? z.input<T> : never;

/**
 * Each retired member READS as `undefined` on the TypeScript face — `?: never`
 * without `exactOptionalPropertyTypes` is `never | undefined`, which collapses.
 * `Equal` separates that from the `string` the `on*` members carried, from the
 * `AIConfig` / record types `config` / `context` carried, and from the `any` a
 * DELETION would leave on this `BaseSchema`-derived carrier.
 */
export type assertionRetiredMembersReadAsTombstones = [
  Expect<Equal<Ts_AIFormAssistSchema['config'], undefined>>,
  Expect<Equal<Ts_AIFormAssistSchema['context'], undefined>>,
  Expect<Equal<Ts_AIFormAssistSchema['onApplySuggestion'], undefined>>,
  Expect<Equal<Ts_AIFormAssistSchema['onRejectSuggestion'], undefined>>,
  Expect<Equal<Ts_AIRecommendationsSchema['config'], undefined>>,
  Expect<Equal<Ts_AIRecommendationsSchema['context'], undefined>>,
  Expect<Equal<Ts_AIRecommendationsSchema['onSelect'], undefined>>,
  Expect<Equal<Ts_AIRecommendationsSchema['onDismiss'], undefined>>,
  Expect<Equal<Ts_NLQuerySchema['config'], undefined>>,
  Expect<Equal<Ts_NLQuerySchema['onSubmit'], undefined>>,
];

/** The zod face agrees for `config` / `context`: each arm accepts nothing but absence. */
export type assertionZodFaceRefusesConfigAndContext = [
  Expect<Equal<InputOf<ShapeOf<typeof AIFormAssistSchema>['config']>, undefined>>,
  Expect<Equal<InputOf<ShapeOf<typeof AIFormAssistSchema>['context']>, undefined>>,
  Expect<Equal<InputOf<ShapeOf<typeof AIRecommendationsSchema>['config']>, undefined>>,
  Expect<Equal<InputOf<ShapeOf<typeof AIRecommendationsSchema>['context']>, undefined>>,
  Expect<Equal<InputOf<ShapeOf<typeof NLQuerySchema>['config']>, undefined>>,
];

/**
 * The non-vacuity twin: members the components DO read keep their real types on
 * both faces, so the rows above measure those members and not a file that
 * stopped resolving.
 */
export type assertionLiveMembersKeepTheirTypes = [
  Expect<Equal<Ts_AIFormAssistSchema['suggestions'], AIFieldSuggestion[] | undefined>>,
  Expect<Equal<Ts_AIRecommendationsSchema['recommendations'], AIRecommendationItem[] | undefined>>,
  Expect<Equal<Ts_NLQuerySchema['result'], NLQueryResult | undefined>>,
  Expect<Equal<InputOf<ShapeOf<typeof NLQuerySchema>['placeholder']>, string | undefined>>,
];

/* ── The `tsc` half on a fresh literal and on a widened value ─────────────── */

const suggestions: AIFieldSuggestion[] = [{ fieldName: 'company', value: 'ObjectStack Inc.', confidence: 0.92 }];
const recommendations: AIRecommendationItem[] = [{ id: 'r1', title: 'Renew', score: 0.8 }];

describe('authoring a retired AI member is a `tsc` error (objectui#10874)', () => {
  it('refuses all four on `ai-form-assist` — presence is the error, not the value', () => {
    const node: Ts_AIFormAssistSchema = {
      type: 'ai-form-assist',
      suggestions,
      // @ts-expect-error `config` is retired (objectui#10874) — configure AI on the provider
      config: { provider: 'openai', model: 'gpt-4' },
      // @ts-expect-error `context` is retired (objectui#10874) — pass it to the provider
      context: { record: 'r1' },
      // @ts-expect-error `onApplySuggestion` is retired (objectui#10874) — pass `onApply` as a component prop
      onApplySuggestion: 'apply',
      // @ts-expect-error `onRejectSuggestion` is retired (objectui#10874) — nothing reads it
      onRejectSuggestion: 'reject',
    };
    expect(node.type).toBe('ai-form-assist');
  });

  it('refuses all four on `ai-recommendations`', () => {
    const node: Ts_AIRecommendationsSchema = {
      type: 'ai-recommendations',
      recommendations,
      // @ts-expect-error `config` is retired (objectui#10874) — configure AI on the provider
      config: { provider: 'anthropic' },
      // @ts-expect-error `context` is retired (objectui#10874) — pass it to the provider
      context: { segment: 'smb' },
      // @ts-expect-error `onSelect` is retired from the node (objectui#10874) — pass it as a component prop
      onSelect: 'select',
      // @ts-expect-error `onDismiss` is retired from the node (objectui#10874) — pass it as a component prop
      onDismiss: 'dismiss',
    };
    expect(node.type).toBe('ai-recommendations');
  });

  it('refuses both on `nl-query`', () => {
    const node: Ts_NLQuerySchema = {
      type: 'nl-query',
      placeholder: 'Ask anything',
      // @ts-expect-error `config` is retired (objectui#10874) — configure AI on the provider
      config: { temperature: 0.2 },
      // @ts-expect-error `onSubmit` is retired from the node (objectui#10874) — pass it as a component prop
      onSubmit: 'submit',
    };
    expect(node.type).toBe('nl-query');
  });

  it('refuses a WIDENED value too — the shape no excess-property check reaches', () => {
    const rawAssist = { type: 'ai-form-assist' as const, suggestions, config: { model: 'gpt-4' } };
    // @ts-expect-error `config` is retired (objectui#10874), reached through a widened value
    const assist: Ts_AIFormAssistSchema = rawAssist;
    const rawRecs = { type: 'ai-recommendations' as const, recommendations, onSelect: 'select' };
    // @ts-expect-error `onSelect` is retired from the node (objectui#10874), reached through a widened value
    const recs: Ts_AIRecommendationsSchema = rawRecs;
    const rawQuery = { type: 'nl-query' as const, onSubmit: 'submit' };
    // @ts-expect-error `onSubmit` is retired from the node (objectui#10874), reached through a widened value
    const query: Ts_NLQuerySchema = rawQuery;
    expect([assist.type, recs.type, query.type]).toEqual(['ai-form-assist', 'ai-recommendations', 'nl-query']);
  });
});

/* ── The runtime half: `config` / `context` refused by name, with the prescription ── */

describe('the zod face refuses `config` / `context` by name (objectui#10874)', () => {
  const CASES = [
    ['ai-form-assist', 'config', { provider: 'openai', model: 'gpt-4' }],
    ['ai-form-assist', 'context', { record: 'r1' }],
    ['ai-recommendations', 'config', { provider: 'anthropic' }],
    ['ai-recommendations', 'context', { segment: 'smb' }],
    ['nl-query', 'config', { temperature: 0.2 }],
  ] as const;

  it.each(CASES)('%s refuses `%s` on the rendering face', (type, key, value) => {
    const result = safeValidateSchema({ type, [key]: value });
    expect(result.success).toBe(false);
    if (result.success) return;
    const [issue] = result.error.issues;
    expect(issue.code).toBe('invalid_type');
    expect(issue.path).toEqual([key]);
    // The refusal names the key and carries the prescription — configure AI on
    // the provider — which is the half a bare `z.never()` would drop.
    expect(issue.message).toContain(`\`${key}\``);
    expect(issue.message).toContain('objectui#10874');
    expect(issue.message).toContain('provider');
  });

  it.each(CASES)('%s refuses `%s` on the strict authoring face', (type, key, value) => {
    const result = StrictAnyComponentSchema.safeParse({ type, [key]: value });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((i) => i.path[0])).toContain(key);
  });

  it('accepts each node WITHOUT them, on both faces — the control', () => {
    const docs = [
      { type: 'ai-form-assist', suggestions, showConfidence: true },
      { type: 'ai-recommendations', recommendations, layout: 'grid' },
      { type: 'nl-query', placeholder: 'Ask anything', showHistory: false },
    ];
    for (const doc of docs) {
      const loose = safeValidateSchema(doc);
      expect(loose.success, JSON.stringify(loose.success ? null : loose.error.issues)).toBe(true);
      expect(StrictAnyComponentSchema.safeParse(doc).success, doc.type).toBe(true);
    }
  });
});
