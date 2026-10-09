/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `record:approval_decision` — the decision panel of an approval request's
 * record page (objectui#12045, B1 of objectui#2763; ruling 6079807016,
 * letter 乙).
 *
 * One node, two parts, both already shipped and both reused as they are:
 *
 *  1. **Progress** — `DecisionProgressIndicator` (A3), drawn from the request's
 *     server-computed `decision_progress` tally. It is present only on a
 *     pending node that aggregates more than one decision, and the panel draws
 *     it only then; nothing is re-derived here.
 *  2. **Decisions** — `DeclaredActionsBar` over `sys_approval_request`'s OWN
 *     declared actions at `record_section`, the location and the bar the
 *     business record page already runs them through (objectui#3055). Every
 *     decision is an ordinary declared `type:'api'` action, its form is
 *     `ActionParamDialog` (a comment and several attachments, ruling Q3-A), and
 *     whether a viewer sees one is the action's own `visible` predicate over
 *     the request's server-computed `viewer` block. The panel adds no
 *     per-action code, so a new decision action is metadata alone.
 *
 * ## No authorable props
 *
 * The panel reads the record context and nothing else: the request row the
 * page bound (with its `viewer` and `decision_progress`, which the approvals
 * get route serves and the data API does not) and the object's declared
 * actions. objectstack-ai/objectstack#22472 proposes exactly this contract
 * for the spec, a `ComponentPropsMap` row that is an empty strict object, so a
 * misspelled key on an authored node is a validation finding instead of a
 * silently ignored prop. The registration below declares no inputs for the
 * same reason.
 *
 * Outside a `sys_approval_request` record page there is no request to decide
 * on, and the panel renders nothing.
 *
 * ## After a decision
 *
 * The action has already POSTed and the runtime has already toasted. What the
 * page owes is a re-read, as data and not as a remount (AGENTS.md #8): the
 * request record (its status, `viewer` and tally change) and the timeline (a
 * decision appends a `sys_approval_action` row), both through the
 * invalidation bus their readers already subscribe to.
 *
 * Registered in app-shell rather than plugin-detail for the reason
 * `record:approvals` is: the bar's runtime depends on `@object-ui/auth`, which
 * plugin-detail deliberately does not pull in. The side-effect registration is
 * imported from the app-shell barrel (`src/index.ts`).
 */

import * as React from 'react';
import { ComponentRegistry } from '@object-ui/core';
import { notifyDataChanged, useRecordContext } from '@object-ui/react';
import { cn } from '@object-ui/components';
import { DecisionProgressIndicator } from '../approval-progress/DecisionProgressIndicator.js';
import { DeclaredActionsBar } from '../DeclaredActionsBar.js';
import { RECORD_APPROVAL_ACTION_LOCATION, SYS_APPROVAL_REQUEST_OBJECT } from '../recordApprovalActions.js';
import type { ApprovalRequestLite } from '../../hooks/useRecordApprovals.js';

/** The timeline object a decision appends a row to. */
const APPROVAL_ACTION_OBJECT = 'sys_approval_action';

export interface ApprovalDecisionPanelProps {
  /**
   * The request row as the approvals get route serves it: the dispatch record
   * the declared actions run against (`{id}` resolves to it) and the `viewer`
   * block their `visible` predicates read.
   */
  request: ApprovalRequestLite & { viewer?: unknown };
  className?: string;
}

/** The two parts over one request row. Module-internal: no package export. */
export function ApprovalDecisionPanel({ request, className }: ApprovalDecisionPanelProps) {
  const progress = request.decision_progress;
  const eligible = (request.pending_approvers || []).length;
  const requestId = String(request.id);

  const handleDecided = React.useCallback(() => {
    notifyDataChanged({ objectName: SYS_APPROVAL_REQUEST_OBJECT, recordId: requestId });
    notifyDataChanged({ objectName: APPROVAL_ACTION_OBJECT });
  }, [requestId]);

  return (
    <div className={cn('space-y-3', className)} data-testid="approval-decision-panel">
      {progress && <DecisionProgressIndicator progress={progress} eligibleApprovers={eligible} />}
      <DeclaredActionsBar
        objectName={SYS_APPROVAL_REQUEST_OBJECT}
        record={request}
        location={RECORD_APPROVAL_ACTION_LOCATION}
        onDone={handleDecided}
      />
    </div>
  );
}

const splitDesigner = (props: Record<string, unknown>) => {
  const { 'data-obj-id': id, 'data-obj-type': type, style } = props || {};
  return { 'data-obj-id': id, 'data-obj-type': type, style } as React.HTMLAttributes<HTMLDivElement>;
};

export interface ApprovalDecisionRendererProps {
  schema?: Record<string, unknown>;
  className?: string;
  [k: string]: unknown;
}

/** The registered renderer: the panel over the bound request, or nothing. */
export const ApprovalDecisionRenderer: React.FC<ApprovalDecisionRendererProps> = ({
  schema: _schema,
  className,
  ...props
}) => {
  const ctx = useRecordContext();
  const designer = splitDesigner(props);
  const row = ctx?.objectName === SYS_APPROVAL_REQUEST_OBJECT ? ctx.data : undefined;
  if (row == null || typeof row !== 'object' || (row as { id?: unknown }).id == null) return null;
  return (
    <div className={className} {...designer}>
      <ApprovalDecisionPanel request={row as ApprovalRequestLite} />
    </div>
  );
};

ComponentRegistry.register('approval_decision', ApprovalDecisionRenderer, {
  namespace: 'record',
  skipFallback: true,
  category: 'record',
  label: 'Approval decision',
  icon: 'Stamp',
  inputs: [],
});

export default ApprovalDecisionRenderer;
