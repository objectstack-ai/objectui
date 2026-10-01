/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Which list views reached this console already translated (objectui#11295).
 *
 * ## Why a view label needs to know where it came from
 *
 * An object's switcher tabs, and the breadcrumb that names the open one, draw
 * views from three reads that the console merges into `objectDef.listViews`
 * (`MetadataProvider.mergeViewsIntoObjects`) and the overlay rows beside them:
 *
 *  - the `/meta/view` documents — view items, view overlays and saved views.
 *    The server translates every one of them for the request's locale
 *    (`translateView` in `@objectstack/spec`), and since objectstack#20731 it
 *    keeps a published edit over the packaged catalog: an explicit override
 *    beats the packaged default;
 *  - the `listViews` an OBJECT document embeds, read from `/meta/object`. The
 *    server's `translateObject` does not translate those, so the client bundle
 *    (`objects.<object>._views.<key>.label`) is their only translation;
 *  - entries the client derives itself — a stack container's expansion, the
 *    "all records" fallback tab — which no server translated either.
 *
 * Running the client bundle over the first kind is a SECOND translation pass:
 * the served label became the bundle's fallback, the bundle entry won it, and a
 * published edit drew as the packaged string (measured on objectstack#20730:
 * `进行中` on the zh-CN tab and breadcrumb over a served `In Progress
 * (edited-20730)`). Dropping the pass for every view would instead leave the
 * second and third kinds untranslated. So the label sites ask, per view, the
 * one question that tells them apart: did the `/meta/view` read serve a
 * document under this view's identity?
 *
 * ## The signal
 *
 * The answer is read from the `view` cache the `/meta/view` read fills —
 * `MetadataProvider`'s, the same request every merged view item came from — by
 * the view's identity (its `name`, which is the tab id for every served kind).
 * Identity only: ⛔ no label text is compared with anything.
 *
 * Outside a `MetadataProvider` the read is empty, so every view keeps the
 * bundle composition it had before.
 */

import { useMetadata } from '@object-ui/react';

/** One identity for "nothing was served", so a dependency list on it holds. */
const NONE_SERVED: readonly unknown[] = Object.freeze([]);

/**
 * The documents the `/meta/view` read served, as the metadata cache holds them.
 *
 * Returns the cache's own array, so it keeps one identity until that read is
 * refetched; it is the PAYLOAD, and a consumer may key a memo on it (AGENTS.md
 * #10). An empty read answers {@link NONE_SERVED}: the no-provider fallback
 * hands out a fresh `[]` per call, which would re-key every such memo on every
 * render.
 */
export function useServedViewItems(): readonly unknown[] {
  const items = useMetadata().getItemsByType('view');
  return Array.isArray(items) && items.length > 0 ? items : NONE_SERVED;
}

/**
 * Whether the `/meta/view` read served a document under `viewId` — i.e.
 * whether that view's label arrived already translated, and is drawn as given.
 */
export function isServedView(servedViews: readonly unknown[], viewId: string | undefined): boolean {
  if (!viewId) return false;
  return servedViews.some(
    (item) => !!item && typeof item === 'object' && (item as { name?: unknown }).name === viewId,
  );
}
