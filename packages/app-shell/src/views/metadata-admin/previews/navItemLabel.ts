// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * A nav item's `label`, as the Studio's two editors of it read and write it.
 *
 * The spec types the label as `I18nLabel`: a plain string or an inline locale
 * map. Two editors sit side by side on the app designer: the canvas card's
 * inline rename (`AppNavCanvas`) and the right-panel nav-item inspector
 * (`StudioNavItemInspector`). Both import this module, so they show the same
 * text and write the same entry (objectui#11128, objectui#11148). ⛔ Never
 * copy the key choice in `renamedLabel` into either editor: a second copy is
 * how the two would come to disagree about which entry an edit changes.
 *
 * Internal to app-shell: not exported from the package root.
 */

import { resolveI18nLabel, type I18nLabel } from '@objectstack/spec/ui';

/**
 * The text of a nav item's `label` in the designer `locale`, resolved through
 * the spec's own resolver, or `''` when there is none.
 *
 * `label` only: `title` / `name` / `path` are not nav-item keys. A locale map
 * is never stringified (that renders `[object Object]`). The text is returned
 * untrimmed, so an input bound to it echoes exactly what the author typed.
 */
export function navItemLabelText(label: I18nLabel | undefined, locale: string): string {
  return resolveI18nLabel(label, locale) ?? '';
}

/**
 * The label an edit writes (objectui#11128).
 *
 * A plain string (or no label) is replaced by the new string, as before. A
 * locale map is NEVER replaced by a string: that would delete every other
 * language's text. Only the designer locale's entry changes, and every other
 * entry is kept. The entry written is the one `resolveI18nLabel` reads first
 * for this locale — the exact tag, else its bare language (`en` under
 * `en-US`) — so the editor shows the new text straight after the edit. A map
 * with neither gains an entry under the exact tag; an entry the resolver only
 * reached as another language's fallback (`default`, `en` under `zh-CN`, a
 * sibling region) is left as it was. Because the new entry is under the exact
 * tag, the next edit finds it first: an editor that writes on every keystroke
 * adds that entry once, never one per keystroke.
 */
export function renamedLabel(cur: I18nLabel | undefined, next: string, locale: string): I18nLabel {
  if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return next;
  const map: Record<string, string> = cur;
  const tag = locale.trim();
  const own = (key: string) => Object.prototype.hasOwnProperty.call(map, key) && typeof map[key] === 'string';
  const key = [tag, tag.split('-')[0]].find(own) ?? tag;
  return { ...map, [key]: next };
}
