/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The view/download affordance a `file` value renders (objectui#9161).
 *
 * A read-only `file` field used to render a NAME and nothing else: the cell
 * renderer a record-detail page resolves showed a localized COUNT for a
 * multi-value field and a bare filename for a single one, `FileField`'s
 * `readonly` branch showed one bare `<span>` per file, and the edit-state row
 * showed a filename beside a delete button. A file that uploaded successfully
 * was therefore unreachable from the product's own UI, while the backend read
 * path, the signing endpoint and the signed URL itself all answered 200.
 *
 * Nothing new is fetched to fix that. `readFileValue` already resolves every
 * stored form to a URL — the expanded value's own `url`, or the stable
 * `/api/v1/storage/files/:id` endpoint derived from a bare `sys_file` id, which
 * 302-redirects to a freshly-signed short-lived URL on every request. This
 * module only turns that URL into one anchor, so every surface that renders a
 * file value renders the SAME affordance instead of three near-copies.
 *
 * ⛔ A value that resolves to no URL renders as plain TEXT, never as an anchor
 * with an empty `href` — the ruling objectui#8490 made for `email` / `url` /
 * `phone` ("nothing to link to, no link"), applied to this family. That branch
 * is decided HERE, once, and each call site hands in the text it already drew
 * as `fallback`; the three surfaces keep their own typography without any of
 * them re-deciding when a link is safe.
 *
 * ⛔ Deliberately NOT re-exported from the package barrel. It is an internal
 * detail shared by two modules, not published surface — `@object-ui/fields`
 * exports exactly what it exported before this card.
 */
import React from 'react';
import { cn } from '@object-ui/components';
import { File as FileIcon } from 'lucide-react';
import type { FileValueView } from './file-value.js';

/**
 * One file: a keyboard-reachable view/download link when it resolves, and the
 * caller's own `fallback` text when it does not.
 *
 * The anchor's accessible name is the file NAME, carried as its link text, so
 * this needs no `aria-label` and therefore no new translation key — the name
 * itself already comes off the i18n channel at every call site (a value that
 * carries no name of its own falls back to `fields.file.fileFallback`).
 *
 * `target="_blank"` + `rel="noopener noreferrer"` mirrors `UrlCellRenderer`,
 * and the click is `stopPropagation`-guarded so opening a file from inside a
 * grid row does not also trigger row navigation — the same guard
 * `ImageCellRenderer` puts on its thumbnail.
 *
 * ⛔ No `download` attribute: whether the browser views the file inline or
 * saves it is the storage endpoint's decision, signed into the
 * `content-disposition` it returns. Forcing one of the two here would override
 * a choice the platform already makes per file.
 */
export function FileValueAffordance({
  view,
  fallback,
  className,
  icon = true,
}: {
  view: FileValueView;
  /**
   * What to draw when the value resolves to no URL. Required rather than
   * defaulted: every call site already had a text rendering of its own, and a
   * default here would quietly replace one of them.
   */
  fallback: React.ReactNode;
  className?: string;
  /** Suppressed where the row already draws its own icon or thumbnail. */
  icon?: boolean;
}): React.ReactElement {
  // Trimmed, because whitespace is not a destination: a value of `'   '`
  // reaches `readFileValue`'s string arm and comes back as a "URL", and an
  // anchor built on it is precisely the dead affordance this module refuses.
  const href = view.url?.trim();
  if (!href) return <>{fallback}</>;
  const name = view.name;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      onClick={(e) => e.stopPropagation()}
      data-slot="file-download-link"
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1 align-middle text-blue-600 hover:text-blue-800 hover:underline',
        className,
      )}
    >
      {icon && <FileIcon className="size-3 shrink-0" aria-hidden="true" />}
      <span className="truncate">{name}</span>
    </a>
  );
}
