/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types - Record Component Schemas
 *
 * Type definitions for record:* page components.
 * Aligned with @objectstack/spec RecordDetailsProps, RecordRelatedListProps,
 * RecordHighlightsProps, RecordActivityProps, RecordChatterProps, RecordPathProps.
 *
 * @module record-components
 * @packageDocumentation
 */

/**
 * ARIA props shared across all record components.
 * Aligned with @objectstack/spec AriaPropsSchema.
 */
export interface RecordComponentAriaProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
}

// ============================================================================
// record:details — Record Detail Panel
// ============================================================================

/**
 * Props for the record:details page component.
 * Displays a record's fields in a structured detail layout.
 * Aligned with @objectstack/spec RecordDetailsProps.
 */
export interface RecordDetailsComponentProps {
  /**
   * Field-grid width for the WHOLE body, as the STRING the contract declares
   * (`@objectstack/spec` `RecordDetailsProps.columns` is
   * `z.enum(['1','2','3','4'])`, schema default `'2'`).
   *
   * It was `number` here until objectui#8604, which is the wrong PRIMITIVE
   * TYPE, not merely a wider range: `{ columns: 2 }` compiled locally and the
   * contract refused it at publish with `invalid_value` at `columns` (measured
   * on the installed pin, 17.4.0, against a control — `columns: '2'` — that
   * parses green on the same instrument). Contract-first (Commandment #0.1):
   * the code moves to the contract's spelling, and today's `columns: 2`
   * authors are the defect surfacing rather than collateral damage.
   *
   * WARNING — this is NOT the spelling `sections[].columns` uses one level
   * down. That key is `z.number().int().min(1).max(4)`, so a section takes the
   * NUMBER `2` and refuses the string, exactly inverting this key. The same
   * word names two different types one level apart; copying either declaration
   * onto the other is refused at publish. See the `columns` member on the
   * `sections[]` entry below, and
   * `__tests__/record-details-columns-8604.test.ts`, which pins both directions
   * against the installed spec.
   */
  columns?: '1' | '2' | '3' | '4';
  /**
   * ⛔ RETIRED UPSTREAM — the contract REFUSES this key by name. Do not author
   * it; `tsc` accepting it here is the defect, not permission.
   *
   * `@objectstack/spec` declares the same top-level key as an ADR-0087 D2
   * tombstone: removed in 17.0.0 (objectstack#6946) because the published
   * `auto` | `custom` semantics were never implemented. Measured on the
   * installed pin (17.4.0): `RecordDetailsProps.safeParse({ layout: 'compact' })`
   * is RED with `invalid_type` at `layout`, and the message is the removal
   * prescription itself. The control on the same instrument fired as it should
   * — every other top-level key here accepts a plausible value, and an
   * undeclared key is refused with a DIFFERENT code (`unrecognized_keys`), so
   * the refusal is about this key by name rather than a schema that refuses
   * everything.
   *
   * ⚠️ Note the third spelling: this face offers `stacked` | `inline` |
   * `compact`, which is not even the `auto` | `custom` the spec published
   * before removing it. No value of either set parses.
   *
   * Every other layer has already withdrawn it — objectui#3818 removed the
   * renderer's dead branch, and `@object-ui/plugin-detail`'s registry manifest
   * deliberately publishes no `layout` input and says so at the site. This
   * declaration is the last live holdout of the spelling.
   *
   * ⚠️ It is still here ON PURPOSE, and this is a ledger of an OPEN divergence,
   * not an endorsement: removing it is a published-surface RETIREMENT that
   * breaks an in-repo consumer (`__tests__/p1-spec-alignment.test.ts` declares
   * `layout: 'stacked'` on this interface and reads it back), and triage on
   * objectui#9040 ruled that consumer out of that card's scope. The removal
   * needs its own change: delete the key, move that consumer, and ship the
   * `minor` retirement changeset — `.changeset/retire-record-details-section-collapsed.md`
   * is the in-repo shape to copy. `__tests__/record-details-top-level-9040.test.ts`
   * pins both halves of this paragraph so it cannot rot into a stale comment.
   */
  layout?: 'stacked' | 'inline' | 'compact';
  /** Sections to organize fields */
  sections?: Array<{
    /** Stable identifier for i18n key resolution (e.g. 'info', 'forecast'). */
    name?: string;
    label?: string;
    /**
     * Field names shown in this section, in order.
     *
     * OPTIONAL since objectui#8497, and optional ONLY in the sense that
     * `group` below is the other way to declare the same fact —
     * `@objectstack/spec` refuses a section carrying neither (and refuses one
     * carrying both). It was required here while `RecordDetailsRenderer` read
     * `group` nowhere, so this type refused the exact shape the spec declares
     * and a TypeScript author could not write the group-reference form at all.
     */
    fields?: string[];
    /**
     * Reference a declared field GROUP instead of enumerating members
     * (`@objectstack/spec` 17.3.0, objectstack#13855, ADR-0085 §5).
     *
     * `{ group: 'contact_info' }` inherits the object's `fieldGroups` entry
     * with that key — its members and its presentation (label, icon,
     * description, collapse) both. Mutually exclusive with `fields` and with
     * every key the group itself declares; a page keeps only `columns`,
     * `showBorder` and `headerColor`, which describe how THIS page lays the
     * section out.
     */
    group?: string;
    /**
     * Field-grid columns for THIS section, an integer 1-4
     * (`@objectstack/spec` `RecordDetailsProps.sections[].columns`). Omit it
     * and `DetailSection` derives the width from the field count. Permitted
     * beside `group`: it describes how this page lays the section out, not
     * anything the group itself declares.
     *
     * WARNING — `number` is correct HERE and only here (objectui#8604): the
     * per-section key is `z.number().int().min(1).max(4)`, while the body-wide
     * `columns` at the top of this interface is a string enum. A section
     * carrying `columns: '2'` is refused with `invalid_type` at
     * `sections.N.columns`; the top-level key refuses `2`. Two types, one word,
     * one level apart.
     */
    columns?: number;
    /**
     * Heading icon, a lucide name (`sections[].icon`). `DetailSection` draws it
     * wherever the heading renders: a titled section, or any collapsible one.
     * Refused beside `group` — the group's own `icon` applies there.
     */
    icon?: string;
    /**
     * Sub-heading text under the section heading (`sections[].description`).
     * `DetailSection` renders it as-is, with no translation lookup, unlike
     * `label`; a collapsible section hides it while collapsed. Refused beside
     * `group`.
     */
    description?: string;
    /**
     * Draw the section's Card chrome (`sections[].showBorder`). Unauthored,
     * `RecordDetailsRenderer` derives it — on for a titled section, off for an
     * untitled one; an authored value wins. Permitted beside `group`.
     */
    showBorder?: boolean;
    /**
     * Start a `collapsible: true` section collapsed
     * (`sections[].defaultCollapsed`). `DetailSection` reads it once, as the
     * initial open state; a non-collapsible section never reads it. Refused
     * beside `group`.
     */
    defaultCollapsed?: boolean;
    /**
     * Section-header background tint (`sections[].headerColor`): the closed
     * six-token vocabulary `DetailSection` resolves through `headerColorClass`.
     * The contract refuses any other value at authoring time rather than
     * silently not painting. Permitted beside `group`.
     */
    headerColor?:
      | 'muted'
      | 'muted/50'
      | 'accent'
      | 'primary/10'
      | 'secondary/10'
      | 'destructive/10';
    collapsible?: boolean;
  }>;
  /** Specific fields to display (overrides auto-detection from object) */
  fields?: string[];
  /**
   * Field names to OMIT from the body — applied to `fields` above and to every
   * section's `fields` (`@objectstack/spec` `RecordDetailsProps.hideFields`,
   * `z.array(z.string())`). It is how a page stops repeating the fields already
   * shown in `record:highlights` or as the page title.
   *
   * Bare field NAMES only, deliberately. `RecordDetailsRenderer` also tolerates
   * `{name}` / `{field}` entries at its read site, but the contract declares
   * `z.array(z.string())` and refuses those values on parse — declaring them
   * here would publish a second dialect the contract rejects (Commandment
   * #0.1). The registry manifest holds the same fence.
   *
   * Declared here since objectui#9040. Every other layer already declared it —
   * the spec, `RecordDetailsRenderer` (`renderers/record-details.tsx`, in the
   * highlight-dedup path) and `@object-ui/plugin-detail`'s registry manifest
   * (objectui#3808) — so this published TypeScript face was the one layer that
   * gave a spec-valid, renderer-honoured, registry-published document `TS2353`.
   */
  hideFields?: string[];
  /**
   * Allow inline field editing in the detail body
   * (`@objectstack/spec` `RecordDetailsProps.inlineEdit`, `z.boolean()`).
   *
   * There is no schema default: the RENDERER's default is on, ANDed with the
   * object's own editability and with the server's effective `apiOperations`,
   * so `undefined` is not the same fact as `false`. `false` force-disables the
   * affordance whatever the object permits (`schema.inlineEdit ?? true` at
   * `renderers/record-details.tsx`).
   *
   * Declared here since objectui#9040, with `showHeader` below — the two keys
   * `@objectstack/spec` 17.0.0 GA added to this block, already declared by the
   * registry manifest under objectui#4668.
   */
  inlineEdit?: boolean;
  /**
   * Render the detail body's OWN heading
   * (`@objectstack/spec` `RecordDetailsProps.showHeader`, `z.boolean()`).
   *
   * Renderer default off (`schema.showHeader ?? false`), because a
   * `record:details` composed under a `page:header` would otherwise draw a
   * second title/star/copy chip beside the page's own.
   *
   * Declared here since objectui#9040 (see `inlineEdit` above).
   */
  showHeader?: boolean;
  /** ARIA accessibility attributes */
  aria?: RecordComponentAriaProps;
}

// ============================================================================
// record:highlights — Key Field Summary
// ============================================================================

/**
 * Props for the record:highlights page component.
 * Shows key fields as a summary/highlights panel (e.g., top of detail page).
 * Aligned with @objectstack/spec RecordHighlightsProps.
 */
export interface RecordHighlightsComponentProps {
  /**
   * Fields to display as highlights — bare names or
   * `{name,label?,icon?,type?,readonly?}` for inline overrides.
   *
   * `readonly: true` suppresses the chip's inline-edit affordance
   * (objectstack#5077) without touching the object field, which is what
   * hook-maintained columns need: marking the object field `readonly` would
   * also strip the hook's own write-back.
   */
  fields: Array<
    string | { name: string; label?: string; icon?: string; type?: string; readonly?: boolean }
  >;
  /**
   * Layout mode for the highlights strip, as the CLOSED SET the contract
   * declares (`@objectstack/spec` `RecordHighlightsProps.layout` is
   * `z.enum(['horizontal','vertical'])` behind a `.default('horizontal')`).
   *
   * It offered a third value, `grid`, until objectui#9187, and the contract
   * never accepted it: measured on the installed pin, 17.4.0,
   * `RecordHighlightsProps.safeParse({ fields: ['name'], layout: 'grid' })` is
   * RED with `invalid_value` at `layout`. So `{ layout: 'grid' }` type-checked
   * here and was refused at the door — a green local build and a rejection at
   * the only layer that matters. Two controls on the same instrument fired as
   * they should: an arbitrary value is refused with the SAME code, so `grid`
   * was not special-cased, and omitting the key parses green, so the schema is
   * not refusing everything. Contract-first (Commandment #0.1): the
   * declaration moves to the contract, the contract is not widened.
   *
   * Every other layer already agreed with the contract — `@object-ui/plugin-detail`
   * publishes `enum: ['horizontal', 'vertical']` for this input in its registry
   * manifest, and `RecordHighlightsRenderer` reads no `layout` at all. This
   * declaration was the last live holdout of the spelling.
   *
   * ⚠️ Do NOT copy this set onto the `layout` one interface up. That one is a
   * tombstone the contract refuses BY NAME (objectui#9040, still open) — the
   * same word, a different divergence, a different repair.
   * `__tests__/record-highlights-layout-9187.test.ts` pins this union against
   * the installed spec in both directions.
   */
  layout?: 'horizontal' | 'vertical';
  /** ARIA accessibility attributes */
  aria?: RecordComponentAriaProps;
}

// ============================================================================
// record:related_list — Related Records Table
// ============================================================================

/**
 * Props for the record:related_list page component.
 * Displays a list of related records via a relationship field.
 * Aligned with @objectstack/spec RecordRelatedListProps.
 */
export interface RecordRelatedListComponentProps {
  /** Related object name */
  objectName: string;
  /** Field on the related object that links back to this record */
  relationshipField: string;
  /** Columns to display in the related list */
  columns?: string[];
  /** Sort configuration — `'field'` / `'-field'` string or explicit array (spec union) */
  sort?: string | Array<{ field: string; order: 'asc' | 'desc' }>;
  /**
   * Number of records to display per page. Spec default: 5 (the renderer
   * applies it when the node didn't pass through a zod parse).
   */
  limit?: number;
  /** Filter conditions */
  filter?: any;
  /** Section title */
  title?: string;
  /** Show "View All" link */
  showViewAll?: boolean;
  /** Available actions for the related list */
  actions?: string[];
  /**
   * Add-existing-via-picker config (generic m2m/junction assignment). Pick
   * records from `add.picker.object` and create link rows in `objectName`
   * (`{[relationshipField]: parentId, [add.linkField]: pickedId}`), or omit
   * `linkField` to re-parent the picked 1:m child. Mirrors the spec
   * RecordRelatedListProps.add.
   */
  add?: {
    picker: { object: string; valueField?: string; labelField?: string; filter?: unknown };
    linkField?: string;
    label?: string;
  };
  /** ARIA accessibility attributes */
  aria?: RecordComponentAriaProps;
}

// ============================================================================
// record:activity — Activity Timeline
// ============================================================================

/**
 * Props for the record:activity page component.
 * Displays an activity feed/timeline for a record.
 * Aligned with @objectstack/spec RecordActivityProps.
 */
export interface RecordActivityComponentProps {
  /** Activity types to display */
  types?: string[];
  /** Filter mode for activity types */
  filterMode?: string;
  /** Show filter toggle UI */
  showFilterToggle?: boolean;
  /** Maximum activities to display */
  limit?: number;
  /** Show completed/resolved activities */
  showCompleted?: boolean;
  /** Merge all activity types into a single timeline */
  unifiedTimeline?: boolean;
  /** Show comment input box */
  showCommentInput?: boolean;
  /** Enable @mentions in comments */
  enableMentions?: boolean;
  /** Enable emoji reactions on activities */
  enableReactions?: boolean;
  /** Enable threaded comment replies */
  enableThreading?: boolean;
  /** Show subscribe/unsubscribe toggle */
  showSubscriptionToggle?: boolean;
  /** ARIA accessibility attributes */
  aria?: RecordComponentAriaProps;
}

// ============================================================================
// record:chatter — Comments & Discussion
// ============================================================================

/**
 * Props for the record:chatter page component.
 * Provides a chat/discussion panel for a record.
 * Aligned with @objectstack/spec RecordChatterProps.
 */
export interface RecordChatterComponentProps {
  /** Panel position */
  position?: 'bottom' | 'right' | 'left';
  /** Panel width (CSS value) */
  width?: string;
  /** Whether the chatter panel is collapsible */
  collapsible?: boolean;
  /** Whether the chatter panel starts collapsed */
  defaultCollapsed?: boolean;
  /** Activity feed configuration within chatter */
  feed?: RecordActivityComponentProps;
  /** ARIA accessibility attributes */
  aria?: RecordComponentAriaProps;
}

// ============================================================================
// record:path — Record Path / Progress Indicator
// ============================================================================

/**
 * Props for the record:path page component.
 * Displays a progress/stage indicator for the record (e.g., Lead → Qualified → Won).
 * Aligned with @objectstack/spec RecordPathProps.
 */
export interface RecordPathComponentProps {
  /** Field that holds the current status/stage value */
  statusField: string;
  /** Ordered list of stages */
  stages: Array<{
    /** Stage value (matches statusField values) */
    value: string;
    /** Display label for the stage */
    label: string;
    /**
     * Terminal classification. Stages marked `'won'` render as the
     * success terminus of the forward path; stages marked `'lost'`
     * render as a visually separated alt-terminus (muted / destructive
     * tint) because they break the chevron flow rather than completing
     * it. When omitted, the renderer falls back to a value/label
     * heuristic (matches common lost-state tokens like `closed_lost`,
     * `lost`, `failed`, `cancelled`, `失败`, `流失`).
     */
    terminal?: 'won' | 'lost';
  }>;
  /** ARIA accessibility attributes */
  aria?: RecordComponentAriaProps;
}
