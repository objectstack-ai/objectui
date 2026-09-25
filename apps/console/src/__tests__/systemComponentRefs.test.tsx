// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * `audit:log` and `ai:approvals` — the component-registry keys for the two
 * console pages the System Hub card wall used to be the only link to
 * (objectui#10520).
 *
 * ## What this file is for
 *
 * Framework navigation reaches a console page only through a
 * `type: 'component'` item whose `componentRef` is a registry key, never a
 * console path. Once objectui#3743 retired the card wall, `AuditLogPage` and
 * `AiPendingActionsPage` had a route but no key, so no navigation entry could
 * name them. This file pins, per key, the properties a nav item exercises:
 *
 *   1. the key is registered at all, by importing the registration module the
 *      way `main.tsx` does (a side effect);
 *   2. the key addresses the `component/<ns>/<name>` URL, built from the ref
 *      through the same helper the sidebar uses rather than spelled out;
 *   3. that URL, served by app-shell's REAL `ComponentNavView`, renders the
 *      page. `ComponentNavView` is what answers `component/:ns/:name/*` in the
 *      shipped route table, so a key that is registered but spelled
 *      differently from the URL fails here, not only in a browser.
 *
 * And, per page, that the key is ADDITIVE: the standalone route still
 * renders the page, through the REAL `systemRoutes` fragment `AppContent`
 * mounts (imported, never transcribed), because bookmarks and deep links
 * carry `system/audit-log` and `system/ai-approvals`.
 *
 * ## Scope of the stubs
 *
 * Both pages are stubbed at the exact specifiers the registration module and
 * `AppContent` lazy-import, so the entries under test are the production ones,
 * Suspense wrappers included. Their internals (the audit table and drawer, the
 * pending-action inbox) are not this change's subject: what belongs to it is
 * only that the key and the route reach the page.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
    language: 'en',
  }),
}));

// The probes stand in for the pages at the exact specifiers
// `registerSystemComponents` and `AppContent` lazy-import.
vi.mock('../pages/system/AuditLogPage', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    AuditLogPage: () => {
      const { appName } = useParams<{ appName?: string }>();
      return <div data-testid="audit-log-probe">{appName ?? '(none)'}</div>;
    },
  };
});
vi.mock('../pages/system/AiPendingActionsPage', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    AiPendingActionsPage: () => {
      const { appName } = useParams<{ appName?: string }>();
      return <div data-testid="ai-approvals-probe">{appName ?? '(none)'}</div>;
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
import '../registerSystemComponents';

/** The `component/...` path the sidebar builds for a `componentRef` nav item. */
const componentPath = (ref: string) => `component/${componentRefToUrlSegments(ref).join('/')}`;

/**
 * The console's app-scoped route shape: the component route app-shell declares
 * beside the host's `systemRoutes` fragment, both under `/apps/:appName/*`.
 */
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

describe.each([
  { ref: 'audit:log', segments: ['audit', 'log'], probe: 'audit-log-probe', route: 'system/audit-log' },
  { ref: 'ai:approvals', segments: ['ai', 'approvals'], probe: 'ai-approvals-probe', route: 'system/ai-approvals' },
])('$ref component ref (objectui#10520)', ({ ref, segments, probe, route }) => {
  it('is registered by the module `main.tsx` side-effect-imports', () => {
    expect(getAppComponent(ref)).toBeDefined();
    expect(getAppComponent(ref)?.source).toBe('@object-ui/console');
  });

  it(`addresses the component/${segments.join('/')} URL segments`, () => {
    expect(componentRefToUrlSegments(ref)).toEqual(segments);
    expect(componentPath(ref)).toBe(`component/${segments.join('/')}`);
  });

  it('resolves to the page through ComponentNavView at the component URL', async () => {
    renderConsoleAt(`/apps/setup/${componentPath(ref)}`);

    expect(await screen.findByTestId(probe)).toHaveTextContent('setup');
    expect(screen.queryByText('Component not registered')).not.toBeInTheDocument();
  });

  it('the standalone route keeps rendering the page (the key is additive)', async () => {
    renderConsoleAt(`/apps/setup/${route}`);

    expect(await screen.findByTestId(probe)).toHaveTextContent('setup');
  });
});
