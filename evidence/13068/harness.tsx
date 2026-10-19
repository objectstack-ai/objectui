// THROWAWAY evidence harness for objectui#13068 (never committed): the real
// full-page AiChatPage and the real ChatDockPanel in Chromium, with `fetch`
// stubbed so no backend is needed. Query: ?mode=fullpage|dock|sheet&drafts=1|0&app=1
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from '@object-ui/i18n';
import { AuthCtx } from '../../../packages/auth/src/AuthContext';
import { AiChatPage } from '../../../packages/app-shell/src/console/ai/AiChatPage';
import { ChatDockPanel, ChatDockMobileSheet } from '../../../packages/app-shell/src/layout/ChatDock';
import './index.css';

const q = new URLSearchParams(location.search);
const MODE = q.get('mode') ?? 'fullpage';
const DRAFTS = q.get('drafts') !== '0';
const PKG = 'com.example.showcase';
const API = '/api/v1/ai';
const DRAFT = { type: 'object', name: 'showcase_task', label: 'Task', packageId: PKG, updatedAt: null, updatedBy: null };
const TURNS = [
  { id: 'r1', role: 'user', content: [{ type: 'text', text: '给任务加一个续借次数字段' }] },
  { id: 'r2', role: 'assistant', content: [{ type: 'text', text: '已存为草稿：这个应用已上线，改动还没有对用户生效。请在「变更」里核对后发布。' }] },
];
const LONG = q.get('long') === '1';
const APP = q.get('app') === '1';
const APP_TURNS = [
  { id: 'a1', role: 'assistant', content: [{ type: 'text', text: '好的，开始搭建。' }, { type: 'tool-call', toolCallId: 't_app', toolName: 'apply_blueprint' }] },
  { id: 'a2', role: 'tool', content: [{ type: 'tool-result', toolCallId: 't_app', toolName: 'apply_blueprint', output: { type: 'text', value: JSON.stringify({ status: 'drafted', kind: 'create', packageId: PKG, drafted: [{ type: 'app', name: 'showcase_app' }, { type: 'object', name: 'showcase_task' }] }) } }] },
];
const MANY = Array.from({ length: 14 }, (_, i) => [
  { id: `l${i}u`, role: 'user', content: [{ type: 'text', text: `第 ${i + 1} 轮：再改一处` }] },
  { id: `l${i}a`, role: 'assistant', content: [{ type: 'text', text: `第 ${i + 1} 轮回答：已存为草稿，请在「变更」里核对后发布。这一行写得长一些，好让消息占两行，看看最后一条消息会不会被挡住。` }] },
]).flat();
const ALL_TURNS = [...(LONG ? MANY : []), ...TURNS, ...(APP ? APP_TURNS : [])];
(window as unknown as { __draftReads: number }).__draftReads = 0;
const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method = init?.method ?? 'GET';
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  if (url.includes('/meta/_drafts')) {
    (window as unknown as { __draftReads: number }).__draftReads += 1;
    return json({ drafts: DRAFTS ? [DRAFT] : [] });
  }
  if (/\/ai\/agents(\?|$)/.test(url)) return json({ success: true, data: { agents: [{ name: 'build', label: 'Build' }] } });
  if (url.endsWith(`${API}/conversations`) && method === 'POST') return json({ id: 'conv_ev', messages: [] });
  if (/\/ai\/conversations\/conv_ev$/.test(url)) return json({ id: 'conv_ev', messages: ALL_TURNS });
  if (url.includes('/api/')) return json({ success: true, data: [] });
  return realFetch(input, init);
};
// The build thread for this package resolves to the seeded conversation.
localStorage.setItem(`objectstack:ai-chat-conversation-id:u1:app:${PKG}:build`, 'conv_ev');

const auth = {
  user: { id: 'u1', name: 'Admin', email: 'admin@objectos.ai' },
  session: null,
  isAuthenticated: true,
  isAuthEnabled: true,
  isLoading: false,
  error: null,
  isPreviewMode: false,
  previewMode: null,
} as never;

const dock = {
  expanded: true,
  width: 420,
  dragging: false,
  maximized: false,
  toggle: () => {},
  expand: () => {},
  collapse: () => {},
  maximize: () => {},
  restore: () => {},
  onResizePointerDown: () => {},
};

function DockShell() {
  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <header className="h-14 shrink-0 border-b" />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 p-6 text-sm text-muted-foreground">Showcase · 任务</main>
        <ChatDockPanel dock={dock} userId="u1" apiBase={API} appPackageId={PKG} />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <I18nProvider config={{ defaultLanguage: 'zh', detectBrowserLanguage: false }}>
    <AuthCtx.Provider value={auth}>
      {MODE === 'sheet' ? (
        <MemoryRouter initialEntries={['/apps/showcase_app/showcase_task']}>
          <div className="flex h-svh w-full flex-col bg-background">
            <header className="h-14 shrink-0 border-b" />
            <main className="min-w-0 flex-1 p-6 text-sm text-muted-foreground">Showcase · 任务</main>
          </div>
          <ChatDockMobileSheet open onOpenChange={() => {}} userId="u1" apiBase={API} appPackageId={PKG} />
        </MemoryRouter>
      ) : MODE === 'dock' ? (
        <MemoryRouter initialEntries={['/apps/showcase_app/showcase_task']}>
          <DockShell />
        </MemoryRouter>
      ) : (
        <MemoryRouter initialEntries={[`/ai/build/conv_ev?package=${PKG}`]}>
          <Routes>
            <Route path="/ai/:agent/:conversationId" element={<AiChatPage apiBase={API} />} />
            <Route path="/ai/:agent" element={<AiChatPage apiBase={API} />} />
          </Routes>
        </MemoryRouter>
      )}
    </AuthCtx.Provider>
  </I18nProvider>,
);
