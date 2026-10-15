/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The `page:header` record chrome draws its favorite star only where the
 * host wires a toggle (objectui#12427).
 *
 * The star is a control that stores something, so it draws only when the
 * `RecordContext` carries `onToggleFavorite`. Without one, the chip used to
 * draw a star that flipped on its own local state and stored nothing; it now
 * draws none. The authored `showStar: false` still hides it when a host does
 * wire a toggle.
 *
 * Pinned through the real `SchemaRenderer` and registry, on the record-chip
 * layout `page:header` draws inside a `RecordContextProvider` (the harness of
 * `page-header-record-picture-11383`), under a real English `I18nProvider`
 * so the star is named as a user hears it. Every case first proves the record
 * chip is really there, so "no star" cannot pass on a header that drew
 * nothing at all.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { ActionProvider, RecordContextProvider, SchemaRenderer } from '@object-ui/react';
import { I18nProvider } from '@object-ui/i18n';
// Registers every renderer at module scope, not in a hook
// (object-ui/no-dynamic-import-in-test-hook, objectui#3010).
import '../renderers';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const OBJECT = {
  name: 'crm_account',
  label: 'Account',
  nameField: 'name',
  fields: { name: { type: 'text', label: 'Name' } },
};

interface HostFavorite {
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

function renderHeader(host: HostFavorite, node: Record<string, unknown> = { type: 'page:header' }) {
  const utils = render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <ActionProvider>
        <RecordContextProvider
          objectName="crm_account"
          recordId="rec-1"
          data={{ id: 'rec-1', name: 'Acme' }}
          objectSchema={OBJECT}
          {...host}
        >
          <SchemaRenderer schema={node as never} />
        </RecordContextProvider>
      </ActionProvider>
    </I18nProvider>,
  );
  const header = utils.container.querySelector('header');
  expect(header, 'the page:header root').not.toBeNull();
  expect(header!.querySelector('h1')?.textContent, 'the record chip title').toBe('Acme');
  // The chip's copy-id button sits in the same row as the star, so the row
  // itself is drawn in every case below.
  expect(header!.querySelector('button[aria-label="Copy record ID"]'), 'the chip copy-id button').not.toBeNull();
  return { ...utils, header: header as HTMLElement };
}

/** The chip's favorite star: the one toggle button with `aria-pressed`. */
function stars(header: HTMLElement): HTMLButtonElement[] {
  return Array.from(header.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'));
}

describe('page:header record chrome: the favorite star draws only where the host wires a toggle (objectui#12427)', () => {
  it('no star when the RecordContext carries no onToggleFavorite', () => {
    const { header } = renderHeader({});
    expect(stars(header)).toHaveLength(0);
    expect(header.querySelector('button[aria-label="Add to favorites"]')).toBeNull();
  });

  it('no star when the host passes favorite state but no toggle', () => {
    const { header } = renderHeader({ isFavorite: true });
    expect(stars(header)).toHaveLength(0);
    expect(header.querySelector('button[aria-label="Remove from favorites"]')).toBeNull();
  });

  it('CONTROL: a context toggle draws the star, and pressing it calls the host once', () => {
    const onToggleFavorite = vi.fn();
    const { header } = renderHeader({ isFavorite: false, onToggleFavorite });
    const [star, ...rest] = stars(header);
    expect(rest).toHaveLength(0);
    expect([star.getAttribute('aria-label'), star.getAttribute('aria-pressed')]).toEqual([
      'Add to favorites',
      'false',
    ]);
    fireEvent.click(star);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('CONTROL: the star mirrors the host state', () => {
    const { header } = renderHeader({ isFavorite: true, onToggleFavorite: () => {} });
    const [star] = stars(header);
    expect([star?.getAttribute('aria-label'), star?.getAttribute('aria-pressed')]).toEqual([
      'Remove from favorites',
      'true',
    ]);
  });

  it('the authored showStar: false hides the star even when the host wires a toggle', () => {
    const { header } = renderHeader(
      { isFavorite: false, onToggleFavorite: () => {} },
      { type: 'page:header', properties: { showStar: false } },
    );
    expect(stars(header)).toHaveLength(0);
  });
});
