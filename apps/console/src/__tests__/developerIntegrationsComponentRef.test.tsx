// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * `developer:integrations` — the component-registry key for the Integrations
 * & APIs page (objectui#10520).
 *
 * ## What this file is for
 *
 * The page's only in-app link was a card on the console's Developer Hub page,
 * and the hub itself lost its only link when objectui#3743 retired the System
 * Hub card wall. Framework navigation reaches a console page only through a
 * registry key, so this key is what lets a navigation entry name the page
 * again. It also carries the premise the hub's retirement rests on: every one
 * of the hub's four destinations is a `developer:*` key, so a card wall
 * duplicating them has nothing left to add.
 *
 * Pinned, in the order a nav item exercises them:
 *
 *   1. the key is registered, by the module `main.tsx` side-effect-imports;
 *   2. it addresses `component/developer/integrations`, built from the ref
 *      through the helper the sidebar uses;
 *   3. that URL, served by app-shell's REAL `ComponentNavView`, renders the
 *      page, and the page still sees `:appName`, which it builds its
 *      "Open API Console" link from;
 *   4. the standalone `developer/integrations` route, through the REAL
 *      `systemRoutes` fragment, keeps rendering it (the key is additive).
 *
 * The page is stubbed at the specifier the registration module and
 * `AppContent` lazy-import, so the registry entry and the route under test are
 * the production ones.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../pages/developer/IntegrationsPage', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    IntegrationsPage: () => {
      const { appName } = useParams<{ appName?: string }>();
      return <div data-testid="integrations-probe">{appName ?? '(none)'}</div>;
    },
  };
});

import { getAppComponent, componentRefToUrlSegments } from '@object-ui/app-shell';
// `ComponentNavView` is not on app-shell's barrel; `@object-ui/app-shell`
// resolves to `packages/app-shell/src` here (`apps/console/vite.config.ts`), so
// this is the same module, and the same registry, the shipped route renders.
import { ComponentNavView } from '../../../../packages/app-shell/src/views/ComponentNavView';
import { systemRoutes } from '../AppContent';

// Side-effect import: this is the module under test.
import '../registerDeveloperComponents';

const REF = 'developer:integrations';

/** The `component/...` path the sidebar builds for a `componentRef` nav item. */
const componentPath = (ref: string) => `component/${componentRefToUrlSegments(ref).join('/')}`;

function renderConsoleAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/apps/:appName/*"
          element={
            <Routes>
              <Route path="component/:ns/:name/*" element={<ComponentNavView />} />
              {systemRoutes}
            </Routes>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('developer:integrations component ref (objectui#10520)', () => {
  it('is registered by the module `main.tsx` side-effect-imports', () => {
    expect(getAppComponent(REF)).toBeDefined();
    expect(getAppComponent(REF)?.source).toBe('@object-ui/console');
  });

  it('addresses the `component/developer/integrations` URL segments', () => {
    expect(componentRefToUrlSegments(REF)).toEqual(['developer', 'integrations']);
    expect(componentPath(REF)).toBe('component/developer/integrations');
  });

  it('resolves to the page through ComponentNavView, which still sees the app segment', async () => {
    renderConsoleAt(`/apps/studio/${componentPath(REF)}`);

    expect(await screen.findByTestId('integrations-probe')).toHaveTextContent('studio');
    expect(screen.queryByText('Component not registered')).not.toBeInTheDocument();
  });

  it('the standalone developer/integrations route keeps rendering the page (the key is additive)', async () => {
    renderConsoleAt('/apps/studio/developer/integrations');

    expect(await screen.findByTestId('integrations-probe')).toHaveTextContent('studio');
  });

  it('every destination of the retired Developer Hub is a registered developer:* key', () => {
    // The hub's four cards, by the key a navigation entry would name. This is
    // the premise its retirement rests on: were any of them unkeyed, the hub
    // would still be that page's only way in.
    for (const ref of [
      'developer:integrations',
      'developer:api-console',
      'developer:flow-runs',
      'developer:public-forms',
    ]) {
      expect(getAppComponent(ref), ref).toBeDefined();
    }
  });
});
