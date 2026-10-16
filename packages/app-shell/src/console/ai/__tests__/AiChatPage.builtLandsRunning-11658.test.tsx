// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11658 item 1 — the post-build transition lands on the RUNNING app.
 *
 * The built-moment transition (objectui#5799) moves the conversation into the
 * Studio workbench at `/studio/PKG/interfaces`. That navigation is where the
 * landing is decided: nothing from the cloud names the destination — the build
 * envelope only supplies the package id. It now asks the Interfaces pillar for
 * the run-mode landing (`STUDIO_RUN_LANDING` router state); the pillar half is
 * pinned in `StudioDesignSurface.runLanding-11658.test.tsx`.
 *
 * Control: the explicit "Design in Studio" door on a finished build is a request
 * to DESIGN, so it passes no landing state and keeps opening on 「设计」.
 *
 * Harness: `AiChatPage.builtTransition.test.tsx`'s faked chat, with the Studio
 * route reporting the router state it was handed.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import React from 'react';

interface FakeMsg {
  id: string;
  role: string;
  content: string;
  toolInvocations?: unknown[];
}

const chat = {
  isLoading: false,
  append: undefined as ((m: FakeMsg) => void) | undefined,
};

vi.mock('@object-ui/plugin-chatbot', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const React2 = await import('react');
  return {
    ...actual,
    useAgents: () => ({
      agents: [{ name: 'metadata_assistant', label: 'Build', capabilities: ['build'] }],
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    }),
    useAiModels: () => ({ models: [], defaultModelId: undefined }),
    useHitlInChat: () => ({ decide: vi.fn(), decisions: {} }),
    useObjectChat: (opts: { initialMessages?: FakeMsg[] }) => {
      const [messages, setMessages] = React2.useState<FakeMsg[]>(() => (opts.initialMessages ?? []) as FakeMsg[]);
      chat.append = (m: FakeMsg) => setMessages((prev) => [...prev, m]);
      return {
        messages,
        isLoading: chat.isLoading,
        error: undefined,
        sendMessage: vi.fn(),
        stop: vi.fn(),
        reload: vi.fn(),
        clear: vi.fn(),
        setMessages: vi.fn(),
      };
    },
    ChatbotEnhanced: (props: Record<string, unknown>) => {
      const msgs = (props.messages ?? []) as FakeMsg[];
      const design = props.onDesignBuiltApp as ((app: string, segment?: string) => void) | undefined;
      return (
        <div data-testid="pane">
          {msgs.map((m) => m.id).join(',')}
          <button type="button" data-testid="design-door" onClick={() => design?.('k9_app', 'app.k9')} />
        </div>
      );
    },
  };
});

vi.mock('@object-ui/auth', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useAuth: () => ({ user: { id: 'u1' } }) };
});
vi.mock('../../../providers/MetadataProvider', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useMetadata: () => ({ apps: [] }) };
});
vi.mock('../../../providers/AdapterProvider', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useAdapter: () => null };
});
vi.mock('../ConversationsSidebar', () => ({ ConversationsSidebar: () => <div data-testid="sidebar" /> }));
vi.mock('../LiveCanvas', () => ({ LiveCanvas: () => <div data-testid="live-canvas" /> }));

import { AiChatPage } from '../AiChatPage';
import { isStudioRunLanding } from '../../../views/studio-design/studioLanding';

window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

const BUILT_TURNS = [
  { id: 'r1', role: 'user', content: [{ type: 'text', text: 'build me a CRM' }] },
  {
    id: 'r2',
    role: 'assistant',
    content: [
      { type: 'text', text: 'Built it.' },
      { type: 'tool-call', toolCallId: 't1', toolName: 'apply_blueprint' },
    ],
  },
  {
    id: 'r3',
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: 't1',
        toolName: 'apply_blueprint',
        output: {
          type: 'text',
          value: JSON.stringify({
            status: 'drafted',
            packageId: 'app.k9',
            drafted: [
              { type: 'app', name: 'k9_app' },
              { type: 'object', name: 'k9_task' },
            ],
          }),
        },
      },
    ],
  },
];

const UNBUILT_TURNS = [
  { id: 'r1', role: 'user', content: [{ type: 'text', text: 'hello' }] },
  { id: 'r2', role: 'assistant', content: [{ type: 'text', text: 'hi — what shall we build?' }] },
];

let serverTurns: unknown[] = [];

function installFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (/\/conversations\/conv-1$/.test(url) && method === 'GET') {
        return new Response(JSON.stringify({ id: 'conv-1', messages: serverTurns }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
}

/** The Studio route, reporting where it was sent and with what router state. */
function StudioProbe() {
  const location = useLocation();
  return (
    <div
      data-testid="studio-page"
      data-path={location.pathname}
      data-run-landing={String(isStudioRunLanding(location.state))}
    />
  );
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/ai/build/conv-1']}>
      <Routes>
        <Route path="/ai/:agent/:conversationId" element={<AiChatPage />} />
        <Route path="/ai/:agent" element={<AiChatPage />} />
        <Route path="/studio/:packageId/:tab" element={<StudioProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  chat.isLoading = false;
  serverTurns = [];
  window.localStorage.clear();
  window.sessionStorage.clear();
  installFetch();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AiChatPage — the post-build landing is the running app (objectui#11658 item 1)', () => {
  it('reopening a built conversation lands on the Interfaces pillar with the run-mode landing', async () => {
    serverTurns = BUILT_TURNS;
    renderPage();
    const studio = await screen.findByTestId('studio-page', {}, { timeout: 4000 });
    expect(studio).toHaveAttribute('data-path', '/studio/app.k9/interfaces');
    expect(studio).toHaveAttribute('data-run-landing', 'true');
  });

  it('a LIVE build completion asks for the run-mode landing too', async () => {
    serverTurns = UNBUILT_TURNS;
    chat.isLoading = true;
    renderPage();
    await waitFor(() => expect(screen.getByTestId('pane')).toBeInTheDocument(), { timeout: 4000 });
    act(() => {
      chat.append?.({
        id: 'live-1',
        role: 'assistant',
        content: 'built',
        toolInvocations: [
          {
            toolCallId: 't9',
            toolName: 'apply_blueprint',
            state: 'output-available',
            draftReview: {
              packageId: 'app.k9',
              items: [
                { type: 'app', name: 'k9_app' },
                { type: 'object', name: 'k9_task' },
              ],
            },
          },
        ],
      });
      chat.isLoading = false;
    });
    act(() => {
      chat.append?.({ id: 'live-2', role: 'assistant', content: 'done' });
    });
    const studio = await screen.findByTestId('studio-page', {}, { timeout: 4000 });
    expect(studio).toHaveAttribute('data-run-landing', 'true');
  });

  it('control: the explicit "Design in Studio" door passes no landing state', async () => {
    serverTurns = UNBUILT_TURNS;
    renderPage();
    await waitFor(() => expect(screen.getByTestId('pane')).toBeInTheDocument(), { timeout: 4000 });
    fireEvent.click(screen.getByTestId('design-door'));
    const studio = await screen.findByTestId('studio-page', {}, { timeout: 4000 });
    expect(studio).toHaveAttribute('data-path', '/studio/app.k9/interfaces');
    expect(studio).toHaveAttribute('data-run-landing', 'false');
  });
});
