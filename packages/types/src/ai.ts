/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types - AI Schema
 *
 * Defines AI-related UI component schemas for intelligent form assistance,
 * recommendations, natural language queries, and data insights.
 */

import type { BaseSchema } from './base.js';

/**
 * AI Provider Type
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';

/**
 * AI Model Type
 */
export type AIModelType = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro' | 'custom';

/**
 * AI Configuration
 */
export interface AIConfig {
  /**
   * AI provider to use
   */
  provider?: AIProvider;

  /**
   * Model identifier
   */
  model?: AIModelType | string;

  /**
   * Custom API endpoint URL
   */
  apiEndpoint?: string;

  /**
   * Sampling temperature (0-1)
   */
  temperature?: number;

  /**
   * Maximum tokens for response
   */
  maxTokens?: number;

  /**
   * System prompt for the AI model
   */
  systemPrompt?: string;
}

/**
 * AI Field Suggestion
 */
export interface AIFieldSuggestion {
  /**
   * Name of the field being suggested
   */
  fieldName: string;

  /**
   * Suggested value for the field
   */
  value: any;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Explanation for the suggestion
   */
  reasoning?: string;
}

/**
 * AI Form Assist Schema - Intelligent form field suggestions
 */
export interface AIFormAssistSchema extends BaseSchema {
  type: 'ai-form-assist';

  /**
   * RETIRED (objectui#8178, ADR-0049, director decision batch #78, 2026-09-07) —
   * `AIFormAssist` takes `({ schema, onApply, onRefresh })` and never reads
   * `formId`: the key named a form nothing looked up. Measured on the retiring
   * branch's own head, whole package: zero occurrences of the identifier in
   * `AIFormAssist.tsx`, with the sibling `showConfidence` (2 occurrences: the
   * destructure and its read) lit as the control, and zero `{...props}` /
   * `{...rest}` spreads anywhere in `@object-ui/plugin-ai` — the
   * `SchemaRenderer` prop channel objectui#8410 found (a renderer consuming a
   * key it never names) does not exist in this package, with
   * `components/src/renderers/disclosure/collapsible.tsx` lit as that
   * instrument's control.
   *
   * A tombstone rather than a plain removal on PRONG 2 of the discriminator
   * (objectui#5941, #7526, #7678): this package's README taught the key as
   * working, in the Quick Start, in the `AIFormAssist` API example and in the
   * schema-driven JSON example. {@link BaseSchema} carries `[key: string]: any`,
   * so a DELETED member is absorbed silently at ANY value — deletion here is not
   * a quieter refusal, it is no refusal — and the tombstone is what makes the
   * compile-time refusal exist, by name.
   *
   * ⛔ Not enforced instead (the ruling's words): implementing reads nobody asked
   * for is capability growth without pull. If an AI backend later needs the
   * form's identity as context, that is a feature card with its own business
   * case.
   * @deprecated Not part of this contract — the value was inert.
   */
  formId?: never;

  /**
   * RETIRED (objectui#8178, ADR-0049, director decision batch #78, 2026-09-07) — see
   * {@link AIFormAssistSchema.formId} for the measurement and the tombstone's
   * grounds. `AIFormAssist.tsx` has zero occurrences of `objectName`; the
   * component reaches no data source at all (it imports nothing from
   * `@object-ui/core`, so the shared record-source ladder that reads
   * `schema.objectName` for the grid/tree/map/calendar/gantt blocks is not on
   * any path a node of this type can take).
   * @deprecated Not part of this contract — the value was inert.
   */
  objectName?: never;

  /**
   * RETIRED (objectui#8178, ADR-0049, director decision batch #78, 2026-09-07) — see
   * {@link AIFormAssistSchema.formId}. Zero occurrences in `AIFormAssist.tsx`:
   * the suggestions the component renders come in already-formed on
   * `suggestions`, each carrying its own `fieldName`, so this key never chose
   * anything.
   * @deprecated Not part of this contract — the value was inert.
   */
  fields?: never;

  /**
   * Additional context for generating suggestions
   */
  context?: Record<string, any>;

  /**
   * AI configuration
   */
  config?: AIConfig;

  /**
   * Current suggestions
   */
  suggestions?: AIFieldSuggestion[];

  /**
   * RETIRED (objectui#8178, ADR-0049, director decision batch #78, 2026-09-07) — see
   * {@link AIFormAssistSchema.formId}. This one was a DEAD DESTRUCTURE rather
   * than an absent one: `AIFormAssist.tsx` destructured `autoFill = false` and
   * never referenced the binding again — the single occurrence of the identifier
   * in the file was that line, against `showConfidence` and `showReasoning` at
   * two each (destructure plus read). Nothing was ever filled automatically.
   * @deprecated Not part of this contract — the value was inert.
   */
  autoFill?: never;

  /**
   * Show confidence scores for suggestions
   */
  showConfidence?: boolean;

  /**
   * Show reasoning for suggestions
   */
  showReasoning?: boolean;

  /**
   * Callback when a suggestion is applied
   */
  onApplySuggestion?: string;

  /**
   * Callback when a suggestion is rejected
   */
  onRejectSuggestion?: string;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `ai-form-assist` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. This renderer takes its configuration from
   * the props bag `SchemaRenderer` spreads rather than from `schema.*`, and
   * carries zero `body` / `children` reads either way.
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `ai-form-assist` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `ai-form-assist` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. This renderer takes its configuration from
   * the props bag `SchemaRenderer` spreads rather than from `schema.*`, and
   * carries zero `body` / `children` reads either way.
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `ai-form-assist` reads — nothing renders it.
   */
  children?: never;
}

/**
 * AI Recommendation Item
 */
export interface AIRecommendationItem {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Recommendation title
   */
  title: string;

  /**
   * Recommendation description
   */
  description?: string;

  /**
   * Relevance score (0-1)
   */
  score: number;

  /**
   * Recommendation category
   */
  category?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;

  /**
   * Action to perform when selected
   */
  action?: {
    /**
     * Action type
     */
    type: string;

    /**
     * Action target
     */
    target?: string;
  };
}

/**
 * AI Recommendations Schema - Intelligent content recommendations
 */
export interface AIRecommendationsSchema extends BaseSchema {
  type: 'ai-recommendations';

  /**
   * RETIRED (objectui#8178, ADR-0049, director decision batch #78, 2026-09-07) — see
   * {@link AIFormAssistSchema.formId} for the measurement and the tombstone's
   * grounds. Zero occurrences in `AIRecommendations.tsx`, which renders the
   * `recommendations` it is handed and fetches nothing.
   * @deprecated Not part of this contract — the value was inert.
   */
  objectName?: never;

  /**
   * Additional context for generating recommendations
   */
  context?: Record<string, any>;

  /**
   * AI configuration
   */
  config?: AIConfig;

  /**
   * Current recommendations
   */
  recommendations?: AIRecommendationItem[];

  /**
   * RETIRED (objectui#8178, ADR-0049, director decision batch #78, 2026-09-07) — the
   * sharpest member of the seven, and the reason the finding was filed. Its doc
   * comment read *"Maximum number of results to display"*, and
   * `AIRecommendations` renders EVERY item in `recommendations` — no slice, no
   * cap, zero occurrences of the identifier in the component. An author who
   * wrote `maxResults: 5` against a 50-item list got 50 rows and no diagnostic.
   *
   * ⛔ Not implemented as a slice instead: that is the Enforce direction the
   * ruling declined — nothing in the repo pulls on it. The renderer's docblock
   * now states that it renders every item, so the promise is withdrawn rather
   * than left unhonoured, and `AIRecommendations.rendersEveryItem-8178.test.tsx`
   * pins the behaviour. Cap the array before you hand it over.
   * @deprecated Not part of this contract — the value was inert.
   */
  maxResults?: never;

  /**
   * Show relevance scores
   */
  showScores?: boolean;

  /**
   * Display layout
   */
  layout?: 'list' | 'grid' | 'carousel';

  /**
   * Callback when a recommendation is selected
   */
  onSelect?: string;

  /**
   * Callback when a recommendation is dismissed
   */
  onDismiss?: string;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Message to display when no recommendations are available
   */
  emptyMessage?: string;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `ai-recommendations` reads
   * NEITHER content channel: no renderer read consumes `body` or `children` for
   * this node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. This renderer takes its configuration from
   * the props bag `SchemaRenderer` spreads rather than from `schema.*`, and
   * carries zero `body` / `children` reads either way.
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `ai-recommendations` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `ai-recommendations` reads
   * NEITHER content channel: no renderer read consumes `body` or `children` for
   * this node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. This renderer takes its configuration from
   * the props bag `SchemaRenderer` spreads rather than from `schema.*`, and
   * carries zero `body` / `children` reads either way.
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `ai-recommendations` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Natural Language Query Result
 */
export interface NLQueryResult {
  /**
   * Original query string
   */
  query: string;

  /**
   * Parsed query representation
   */
  parsedQuery?: Record<string, any>;

  /**
   * Result data
   */
  data?: any[];

  /**
   * Column definitions for the result data
   */
  columns?: Array<{
    /**
     * Column name
     */
    name: string;

    /**
     * Display label
     */
    label?: string;

    /**
     * Column data type
     */
    type?: string;
  }>;

  /**
   * AI-generated summary of the results
   */
  summary?: string;

  /**
   * Confidence score for the query interpretation (0-1)
   */
  confidence?: number;
}

/**
 * Natural Language Query Schema - Query data using natural language
 */
export interface NLQuerySchema extends BaseSchema {
  type: 'nl-query';

  /**
   * RETIRED (objectui#8178, ADR-0049, director decision batch #78, 2026-09-07) — see
   * {@link AIFormAssistSchema.formId} for the measurement and the tombstone's
   * grounds. Zero occurrences in `NLQueryInput.tsx`: the component collects a
   * query string and hands it to `onSubmit`, and any object scoping belongs to
   * the host that answers it.
   * @deprecated Not part of this contract — the value was inert.
   */
  objectName?: never;

  /**
   * Input placeholder text
   */
  placeholder?: string;

  /**
   * AI configuration
   */
  config?: AIConfig;

  /**
   * Current query result
   */
  result?: NLQueryResult;

  /**
   * Example queries to suggest
   */
  suggestions?: string[];

  /**
   * Show query history
   */
  showHistory?: boolean;

  /**
   * Query history entries
   */
  history?: Array<{
    /**
     * Query string
     */
    query: string;

    /**
     * Timestamp of the query
     */
    timestamp: string;
  }>;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Callback when a query is submitted
   */
  onSubmit?: string;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `nl-query` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. This renderer takes its configuration from
   * the props bag `SchemaRenderer` spreads rather than from `schema.*`, and
   * carries zero `body` / `children` reads either way.
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `nl-query` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `nl-query` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. This renderer takes its configuration from
   * the props bag `SchemaRenderer` spreads rather than from `schema.*`, and
   * carries zero `body` / `children` reads either way.
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `nl-query` reads — nothing renders it.
   */
  children?: never;
}

/**
 * `AIInsightsSchema` (`type: 'ai-insights'`) — RETIRED. This comment is the
 * tombstone, because a TypeScript interface erases and leaves no runtime residue
 * that could carry a marker of its own.
 *
 * RETIRED under ADR-0049 enforce-or-remove by the director-seat ruling recorded
 * on objectui#8800 (decision batch #137 item 2, 2026-09-15, maintainer verbatim
 * 「同意」), letter **A** of the three the card offered: retire the declaration
 * and its barrel export. ⛔ Not B (write a renderer for it) and ⛔ not C (keep it
 * as a documented forward declaration) — both were refused by that ruling, and
 * ⛔ neither may be re-proposed by a card that measured something adjacent. The
 * whole-family precedent kept as a module tombstone is `./blocks.ts`; the
 * member-level precedent one screen up is objectui#8178.
 *
 * **What went.** The exported `AIInsightsSchema` interface and its
 * `@object-ui/types` barrel re-export. On top of {@link BaseSchema} it declared
 * `objectName`, `data`, `config`, `insights[]` (each with `title`,
 * `description`, `type`, `severity` and `metric`), `loading`, `autoRefresh` and
 * `refreshInterval`. There is no replacement key and no replacement type.
 *
 * **Why.** Declared and unrenderable. NOTHING in this repository ever registered
 * the `ai-insights` discriminant, so no node carrying that spelling ever reached
 * a renderer, and the spelling occurred exactly once tree-wide — the `type`
 * literal inside this very declaration. The three siblings this file still
 * declares (`ai-form-assist`, `ai-recommendations`, `nl-query`) landed in the
 * same commit as this one and were given renderers and registrations twenty-two
 * minutes later by `@object-ui/plugin-ai`; this fourth one never was, for the
 * seven months that followed. ⛔ The census is not copied into this prose: it is
 * re-derived, with a lit control in the same pass, by the pin named at the foot
 * of this block.
 *
 * **What an author got, and why a LOUD failure was still ruled a defect.**
 * `SchemaRenderer` resolves an unregistered discriminant to the OBJUI-001
 * "Unknown component type" panel, and the CLI validator reports an unknown
 * schema type. Two loud refusals — ⛔ not a silent swallow, which is why the card
 * was p3 and not urgent. But TypeScript said YES, because this declaration sat
 * on the PUBLISHED `.d.ts`. A compile-time blessing in front of a guaranteed
 * runtime refusal is what misleads an author — and misleads an AI reading the
 * `.d.ts` as its authoring manual. The retirement moves the refusal from run
 * time to the moment the node is written, which is the whole of what it buys.
 *
 * ⚠️ **The zero above is the IN-REPO HALF and nothing more.** This repository was
 * enumerated; customer applications and published documents outside it were NOT,
 * and the ruling was taken with that limit attached. `@object-ui/types` is a
 * published package, so an external TypeScript consumer that authored this node
 * is structurally unobservable from here and gets a compile error naming the
 * symbol. That consumer's document was already being refused at run time; the
 * FROM/TO in this retirement's changeset is what it greps.
 *
 * ⚠️ **NOT retired, deliberately.** {@link AIFormAssistSchema},
 * {@link AIRecommendationsSchema} and {@link NLQuerySchema} above are registered
 * and rendered, and stay. Their seven zero-read MEMBERS are objectui#8178's
 * `?: never` tombstones — a different retirement, a different ruling, and ⛔ not
 * reachable from this one. The support types {@link AIConfig},
 * {@link AIFieldSuggestion}, {@link AIRecommendationItem} and
 * {@link NLQueryResult} stay too: each has a reader among those three, so none
 * is orphaned by this removal.
 *
 * The pin that makes this tombstone executable — the absence of the symbol, the
 * absence of the spelling, and the lit controls that keep both from being
 * vacuous — is `__tests__/ai-insights-retired-8800.test.ts`.
 */
