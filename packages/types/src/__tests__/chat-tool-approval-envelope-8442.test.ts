// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * `ChatToolInvocation.approval` — declared, mirrored, and OPTIONAL (objectui#8442).
 *
 * ## What is pinned, and why each pin is the one that can fail
 *
 * The member exists because three of the ten declared `state` values —
 * `approval-requested`, `approval-responded`, `output-denied` — are states the
 * AI SDK's own tool-part union cannot express WITHOUT this envelope. The
 * hydration mapper in `@object-ui/app-shell` carried those states through while
 * dropping the envelope, so the state survived the hop and the data that makes
 * it actionable did not.
 *
 * 1. RETENTION, not `success`. `ChatToolInvocationSchema` is a plain `z.object`
 *    — STRIP mode — so `safeParse` is green for an undeclared key too; it just
 *    deletes it. A `.success` assertion therefore cannot tell "declared" from
 *    "silently dropped", and the control below demonstrates exactly that on the
 *    same instrument. Reading the key back OUT of `data` is the assertion that
 *    fails when the mirror has not been widened.
 * 2. VALUE judgment, separately. `id` is the envelope's only required member,
 *    so a payload missing it must be REFUSED rather than stripped-and-green.
 * 3. OPTIONALITY. This card ships the widening half only; pairing the envelope
 *    with the three states that require it is objectui#8426's narrowing. An
 *    invocation that declares one of those states and carries no envelope still
 *    parses today, and that is a deliberate statement, not an omission.
 *
 * The TS-side/Zod-side KEY parity is not restated here: `zod-mirror-parity.test.ts`
 * registers this pair and derives its key census from the mirror's own `.shape`,
 * so a member added on one side only fails there with no list to maintain.
 */

import { describe, it, expect } from 'vitest';
import { ChatToolInvocationSchema } from '../zod/complex.zod';
import type { ChatToolInvocation } from '../complex';

const ENVELOPE = {
  id: 'apr_8442',
  approved: true,
  reason: 'operator confirmed',
  isAutomatic: false,
  signature: 'sig_abc',
} as const;

function invocation(extra: Record<string, unknown> = {}) {
  return {
    toolCallId: 'tc-1',
    toolName: 'action_delete_task',
    state: 'approval-requested',
    ...extra,
  };
}

describe('ChatToolInvocation.approval — the mirror declares it', () => {
  it('KEEPS a full envelope on the parsed output (strip mode: an undeclared key would be gone)', () => {
    const parsed = ChatToolInvocationSchema.safeParse(invocation({ approval: ENVELOPE }));
    expect(parsed.success).toBe(true);
    // The load-bearing line. Before the mirror was widened this read `undefined`
    // while `success` stayed `true`.
    expect(parsed.success && parsed.data.approval).toEqual(ENVELOPE);
  });

  it('CONTROL — an undeclared sibling key is stripped while `success` stays true', () => {
    // Same instrument, same fixture shape, a key nothing declares. This is what
    // the assertion above would read if `approval` were still unmirrored, and it
    // is why `success` alone proves nothing here.
    const parsed = ChatToolInvocationSchema.safeParse(
      invocation({ approvalEnvelope: ENVELOPE }),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.success && 'approvalEnvelope' in parsed.data).toBe(false);
  });

  it('keeps a MINIMAL envelope — only `id` is required', () => {
    const parsed = ChatToolInvocationSchema.safeParse(
      invocation({ approval: { id: 'apr_min' } }),
    );
    expect(parsed.success && parsed.data.approval).toEqual({ id: 'apr_min' });
  });

  it('REFUSES an envelope without a usable `id` — a value judgment, not a strip', () => {
    const noId = ChatToolInvocationSchema.safeParse(invocation({ approval: { approved: true } }));
    expect(noId.success).toBe(false);
    const wrongType = ChatToolInvocationSchema.safeParse(invocation({ approval: { id: 42 } }));
    expect(wrongType.success).toBe(false);
  });

  it('is OPTIONAL — the widening half ships alone, so an approval state with no envelope still parses', () => {
    // objectui#8426 owns the narrowing that makes this pair mandatory. Until it
    // lands, refusing here would be this card shipping that card's break.
    for (const state of ['approval-requested', 'approval-responded', 'output-denied'] as const) {
      const parsed = ChatToolInvocationSchema.safeParse(invocation({ state }));
      expect(parsed.success).toBe(true);
      expect(parsed.success && parsed.data.approval).toBeUndefined();
    }
  });
});

describe('ChatToolInvocation.approval — the declaration admits what the mirror keeps', () => {
  it('type-checks the full and the minimal envelope', () => {
    const full: ChatToolInvocation = {
      toolCallId: 'tc-1',
      toolName: 'action_delete_task',
      state: 'approval-requested',
      approval: { ...ENVELOPE },
    };
    const minimal: ChatToolInvocation = {
      toolCallId: 'tc-2',
      toolName: 'action_delete_task',
      approval: { id: 'apr_min' },
    };
    // `id` is non-optional on the declared envelope; the two values above are
    // the compile-time statement and these reads keep them from being elided.
    expect(full.approval?.id).toBe('apr_8442');
    expect(minimal.approval?.approved).toBeUndefined();
  });
});
