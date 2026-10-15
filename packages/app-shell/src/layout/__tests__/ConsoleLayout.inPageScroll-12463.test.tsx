// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#12463 — the console inset's half of the list page's bounded height
 * chain, and the pages that keep scrolling the inset.
 *
 * Measured in a real browser before the change (the PR carries the
 * readings): with any banner above the route (a preview bar, a notification
 * banner), the object list page — `h-full`, scrolling inside its own table
 * box — was 100% of the inset PLUS the banner, so the inset overflowed by the
 * banner's height: a second scroller over the table's own, the record-count
 * footer below the fold, and the page header scrolling away once the table
 * reached its end. From `lg` up the inset is now a flex column whose children
 * may shrink (`min-h-0`), with the banners in one non-shrinking box, so a
 * bounded page takes the height left after the banners.
 *
 * Pages that rely on the inset scroll — natural-height pages such as search
 * results and the marketplace — overflow their own box and keep the inset
 * scrolling with the same scroll height (browser reading on the PR). jsdom
 * does no layout, so what is pinned here is the class contract the browser
 * reading rests on.
 *
 * ## Real subjects
 *
 * `ConsoleLayout` with its real `AppShell`; the chrome it mounts and this card
 * does not touch is stubbed, the banners as markers.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
    language: 'en',
  }),
}));
vi.mock('../../hooks/useAiSurface', () => ({
  useAiSurfaceEnabled: () => ({ enabled: false, isLoading: false }),
}));
vi.mock('../UnifiedSidebar', () => ({ UnifiedSidebar: () => null }));
vi.mock('../AppHeader', () => ({ AppHeader: () => <div data-testid="app-header-stub" /> }));
vi.mock('../ConsoleNotificationBanners', () => ({
  ConsoleNotificationBanners: () => <div data-testid="notification-banner" />,
}));
vi.mock('../../preview/DraftPreviewBar', () => ({ DraftPreviewBar: () => <div data-testid="draft-preview-bar" /> }));
vi.mock('../../preview/UnpublishedAppBar', () => ({ UnpublishedAppBar: () => null }));

import { ConsoleLayout } from '../ConsoleLayout';
import { NavigationProvider } from '../../context/NavigationContext';

const APP = { name: 'crm', label: 'CRM', active: true, navigation: [] };

function mountConsole(page: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/apps/crm']}>
      <NavigationProvider>
        <ConsoleLayout activeAppName="crm" activeApp={APP} onAppChange={vi.fn()} objects={[]}>
          {page}
        </ConsoleLayout>
      </NavigationProvider>
    </MemoryRouter>,
  );
}

afterEach(() => cleanup());

describe('the console inset bounds a self-scrolling page below the banners (objectui#12463)', () => {
  it('from lg up the inset is a flex column whose children may shrink; it still scrolls on y', () => {
    mountConsole(<div data-testid="route-content" className="h-full">list page</div>);
    const page = screen.getByTestId('route-content');
    const inset = page.parentElement as HTMLElement;
    expect(inset.tagName).toBe('MAIN');
    expect(inset).toHaveClass('lg:flex', 'lg:flex-col', 'lg:[&>*]:min-h-0');
    expect(inset).toHaveClass('overflow-y-auto', 'overflow-x-hidden');
    // The phone keeps block layout: no unprefixed flex on the inset.
    expect(inset).not.toHaveClass('flex');
  });

  it('the banners sit in ONE non-shrinking box, above the route page, both children of the inset', () => {
    mountConsole(<div data-testid="route-content" className="h-full">list page</div>);
    const banners = screen.getByTestId('console-banners');
    const page = screen.getByTestId('route-content');
    expect(banners).toHaveClass('shrink-0');
    expect(banners).toContainElement(screen.getByTestId('draft-preview-bar'));
    expect(banners).toContainElement(screen.getByTestId('notification-banner'));
    expect(banners.parentElement).toBe(page.parentElement);
    expect(banners.compareDocumentPosition(page) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a natural-height page (relies on the inset scroll) is still a direct child of the scrolling inset, unwrapped', () => {
    mountConsole(
      <div data-testid="natural-page" className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="h-[2000px]">search results</div>
      </div>,
    );
    const page = screen.getByTestId('natural-page');
    const inset = page.parentElement as HTMLElement;
    expect(inset.tagName).toBe('MAIN');
    expect(inset).toHaveClass('overflow-y-auto');
    // Nothing the inset adds caps the page's own height or clips it.
    expect(page.className).not.toMatch(/overflow-hidden|h-full|max-h/);
  });
});
