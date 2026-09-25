/**
 * AI Pending Actions Page
 *
 * Console workspace entry for the HITL (Human-In-The-Loop) approval queue
 * exposed by `@objectstack/service-ai` at `/api/v1/ai/pending-actions/*`.
 *
 * Thin page wrapper around the shared `AiPendingActionsInbox` component
 * shipped from `@object-ui/plugin-chatbot`. When objectui#10520 read the tree,
 * this page was that component's only mount and so the only surface listing
 * the whole queue (the chat shows approval cards for its own conversation
 * only); that is a one-time reading, and nothing re-derives it. It is
 * served at the standalone route `/system/ai-approvals` and registered as the
 * `ai:approvals` component ref that framework navigation can name
 * (`registerSystemComponents.tsx`, objectui#10520).
 */

import { useMemo } from 'react';
import { AiPendingActionsInbox } from '@object-ui/plugin-chatbot';

/**
 * Resolve the AI service base URL the same way
 * `ConsoleFloatingChatbot` does, so the inbox + the chat panel always
 * point at the same backend.
 */
function resolveApiBase(): string {
  const env = (import.meta as any).env ?? {};
  const fromEnv = env.VITE_AI_BASE_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const serverUrl = (env.VITE_SERVER_URL as string | undefined) ?? '';
  return `${serverUrl.replace(/\/$/, '')}/api/v1/ai`;
}

export function AiPendingActionsPage() {
  const apiBase = useMemo(() => resolveApiBase(), []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">AI Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review actions an AI agent proposed. Approve to execute them
          server-side; reject to send a reason back to the model so it
          can revise the next turn.
        </p>
      </div>
      <AiPendingActionsInbox
        apiBase={apiBase}
        variant="card"
        title="Queue"
        description="Polled every 5 seconds. Decisions are recorded under your identity."
      />
    </div>
  );
}

export default AiPendingActionsPage;
