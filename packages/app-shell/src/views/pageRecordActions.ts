/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RelatedRecordActionsValue, RelatedRecordHandlers } from '@object-ui/react';

/** No related-list handlers — see {@link pageRecordActionsValue}. */
const NO_RELATED_HANDLERS: RelatedRecordHandlers = Object.freeze({});

/**
 * What a custom page publishes on `RelatedRecordActionsContext`
 * (objectui#11293): the console's record navigator, for the blocks placed on
 * the page.
 *
 * A block on a page is rendered with no host callback — the page is a
 * document, and a document carries no function. So an `object-kanban` or
 * `object-calendar` whose authored `navigation` resolves to `page` (the
 * spec's default `mode`) had nowhere to go: `useNavigationOverlay` hands such
 * a click to the record navigator its host publishes, and this host published
 * none. The record page and the object list page already publish one (the
 * record page's `RelatedRecordActionsBridge`, the list page's
 * `listRecordActionsValue`); this is the third surface, so a `page` click
 * resolves the same way wherever the block sits.
 *
 * Deliberate limits, on the model of `listRecordActionsValue`:
 *
 *  - **`resolve` returns no handlers.** A page has no parent record, so it has
 *    no related lists to serve; an empty handler set is what the context
 *    documents as "capability unavailable", the same read-only outcome a
 *    consumer gets with no provider at all.
 *  - **Only objects this console can route to.** `recordHref` answers `null`
 *    for an object outside the app's metadata, or outside an app route, and
 *    `openRecord` then does nothing — the shape of the record page's own
 *    builder, `/apps/:app/:object/record/:id`.
 *
 * ⚠️ The same seam feeds the grid's link column and the lookup cells, so on a
 * page those now render as real anchors to the record they name, as they
 * already do on the record and list pages.
 *
 * Its own module so `PageView.tsx` exports components only; pinned by
 * `__tests__/PageView.recordNavigator-11293.test.tsx`.
 */
export function pageRecordActionsValue(
  appName: string | undefined,
  objects: ReadonlyArray<unknown>,
  navigate: (to: string) => void,
): RelatedRecordActionsValue {
  const routable = new Set(
    objects
      .map((o) => (o as { name?: unknown } | null | undefined)?.name)
      .filter((name): name is string => typeof name === 'string' && name !== ''),
  );
  const recordHref = (objectName: string, recordId: string | number): string | null =>
    appName && routable.has(objectName) && recordId != null && recordId !== ''
      ? `/apps/${appName}/${objectName}/record/${encodeURIComponent(String(recordId))}`
      : null;
  return {
    resolve: () => NO_RELATED_HANDLERS,
    recordHref,
    openRecord: (objectName, recordId) => {
      const href = recordHref(objectName, recordId);
      if (href) navigate(href);
    },
  };
}
