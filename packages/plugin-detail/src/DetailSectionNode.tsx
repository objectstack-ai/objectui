/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The component the `detail-section` TAG is registered against — the seam that
 * makes the block's eight declared `inputs` true (objectui#8626).
 *
 * ## The defect this closes
 *
 * `ComponentRegistry.register('detail-section', …)` declares eight FLAT inputs
 * — `title`, `description`, `fields`, `collapsible`, `defaultCollapsed`,
 * `columns`, `showBorder`, `headerColor`. `DetailSection` declares no such
 * props: it takes a single `section` object and reads `section.title`,
 * `section.fields`, `section.defaultCollapsed` and the rest off it. The two
 * are joined by `SchemaRenderer`, which spreads a node's non-metadata keys as
 * React props — so an authored node arrived as `title` / `fields` / … and
 * `section` arrived as `undefined`.
 *
 * That is not "every input inert". MEASURED on `b775500af` by rendering an
 * authored node through the real `SchemaRenderer` and the real registry:
 * `DetailSection`'s first statement is `React.useState(section.defaultCollapsed
 * ?? false)`, so the render THREW, `SchemaErrorBoundary` caught it, and the
 * author's page showed an orange banner reading
 * `Component "detail-section" failed to render — Cannot read properties of
 * undefined (reading 'defaultCollapsed')`. Every authored key was lost AND the
 * block became a visible hole.
 *
 * ## Why the fold, and not a re-declaration
 *
 * The two repairs objectui#8626 names are not symmetric, and the measurement
 * decides between them rather than taste:
 *
 *  - The flat eight are the PUBLISHED surface, and the platform enforces them.
 *    `packages/components/src/renderers/layout/page.tsx` builds the JSX-page
 *    compiler's manifest from `getKnownTypes()` plus these `inputs`, and
 *    `sdui-parser`'s `validateTree` judges an authored page against it.
 *    Measured against that live manifest: the flat eight draw ZERO
 *    diagnostics, while `section` draws `unknown-prop` AND
 *    `missing-required-prop "fields"`. The validator does not merely permit
 *    the flat shape — it REFUSES the nested one.
 *  - The flat shape is authored: `packages/plugin-detail/README.md` documents
 *    a `detail-section` node inside `tabs[].content` (which `DetailTabs`
 *    renders through `SchemaRenderer`), and
 *    `__tests__/detailSectionHeaderColorEnum-6955.test.ts` pins the flat
 *    `fields` + `headerColor` surface against that same validator.
 *
 * Re-declaring the registration as a nested `section` object would therefore
 * invalidate both, and would delete the surface objectui#6955 had just
 * narrowed. Folding at the seam invalidates nothing: every authored node keeps
 * validating and starts rendering.
 *
 * ## Why HERE and not inside `DetailSection`
 *
 * `DetailSection` is a published export with five in-repo callers
 * (`DetailView`, `SectionGroup` and their tests), every one of which passes
 * `section={…}` as a direct JSX child — none goes through the registry. Teaching
 * the component two prop shapes would put a second dialect in front of all of
 * them (AGENTS.md #0.1). The registration seam is where the translation
 * belongs, and this package already does exactly that for
 * `field:permission-facet-link` via `withFieldCarrier` (objectui#3307).
 *
 * ⇒ this adapter accepts the DECLARED surface and nothing else. It does not
 * take a `section` prop: a node carrying one is refused by the platform
 * validator, so honouring it here would create the second de-facto contract
 * #0.1 exists to prevent.
 */

import * as React from 'react';
import type { DetailViewSection } from '@object-ui/types';
import { DetailSection, type DetailSectionProps } from './DetailSection';

/**
 * The section members an authored `detail-section` node carries as FLAT props,
 * i.e. exactly the names the registration declares as `inputs`.
 *
 * Single source for the fold. `detailSectionAuthoredNode-8626.test.tsx` pins
 * this list against the registration's own declared input names in BOTH
 * directions, so a ninth input declared without a fold — the shape of the
 * original defect — reds rather than arriving silently inert.
 */
export const DETAIL_SECTION_NODE_INPUTS = [
  'title',
  'description',
  'fields',
  'collapsible',
  'defaultCollapsed',
  'columns',
  'showBorder',
  'headerColor',
] as const;

type DetailSectionNodeInput = (typeof DETAIL_SECTION_NODE_INPUTS)[number];

/**
 * What an author may write on a `detail-section` node: the eight declared
 * inputs, flat, plus the render-context props a host supplies.
 */
export type DetailSectionNodeProps = Omit<DetailSectionProps, 'section'> &
  Partial<Pick<DetailViewSection, DetailSectionNodeInput>>;

export const DetailSectionNode: React.FC<DetailSectionNodeProps> = ({
  title,
  description,
  fields,
  collapsible,
  defaultCollapsed,
  columns,
  showBorder,
  headerColor,
  ...rest
}) => {
  /**
   * The fold. `fields` is `required: true` on the registration, so an absent
   * one is already an ERROR from `validateTree`; it is NOT defaulted to `[]`
   * here — a lenient default would make the required declaration untrue in the
   * other direction.
   *
   * Undefined members are left undefined rather than stripped: every read site
   * in `DetailSection` tests the VALUE (`section.title &&`,
   * `section.showBorder === false`, `section.defaultCollapsed ?? false`), never
   * key presence, so an unauthored key and an absent key are the same section.
   */
  const section = React.useMemo(
    () =>
      ({
        title,
        description,
        fields,
        collapsible,
        defaultCollapsed,
        columns,
        showBorder,
        headerColor,
      }) as DetailViewSection,
    [title, description, fields, collapsible, defaultCollapsed, columns, showBorder, headerColor],
  );

  return <DetailSection {...rest} section={section} />;
};

DetailSectionNode.displayName = 'DetailSectionNode(DetailSection)';
