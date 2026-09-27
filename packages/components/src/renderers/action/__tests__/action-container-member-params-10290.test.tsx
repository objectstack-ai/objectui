/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10290: a member of an action CONTAINER (`action:bar`,
 * `action:group`, `action:menu`) carries its static execution values in
 * `properties.params` (objectui#10289, ruling A), and those values are
 * templates evaluated where `properties` are (objectui#7867, ruling A). A
 * container member never passes through the `SchemaRenderer` evaluation memo,
 * so each container evaluates its members' `properties` through the evaluator
 * that memo uses, against the scope that memo builds.
 *
 * Driven end to end through the real pieces: the real `SchemaRenderer` renders
 * the real container, the click or menu selection goes through the real
 * `ActionRunner`, and the value asserted is the `params` on the `ActionDef` the
 * registered `navigate_edit` handler receives. The row is bound the way a
 * record page binds it, through `RecordContextProvider`.
 *
 * The CONTROL is a top-level `action:button` with the same `properties.params`.
 * It goes through the `SchemaRenderer` memo, so it resolved before this change
 * too: a red container row beside a green control means the container, never
 * an unbound `record` root.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { ActionContext, ActionDef, ActionResult } from '@object-ui/core';
import type { BaseSchema } from '@object-ui/types';
import { ActionProvider, RecordContextProvider, SchemaRenderer } from '@object-ui/react';
// Module-scope side-effect imports: `action:bar` resolves its members and its
// overflow menu through the ComponentRegistry at render time, and the light
// `dom` project does not load the components graph. Module scope, not a
// `beforeAll`, per AGENTS.md 测试纪律.
import '../action-bar';
import '../action-button';
import '../action-icon';
import '../action-menu';
import '../action-group';
import { resetStaticParamsWarnings } from '../static-params';

const ROW = { id: 'rec_1', name: 'Acme' };

/** The authored values: one template leaf, one literal leaf. */
const AUTHORED = { objectName: 'account', recordId: '${record.id}' };

/** What the handler must receive once the template is evaluated. */
const RESOLVED = { objectName: 'account', recordId: 'rec_1' };

/** The overflow trigger's accessible name, with no i18n bundle loaded. */
const MORE = 'More actions';

let navigateEdit: Mock<(action: ActionDef, ctx: ActionContext) => Promise<ActionResult>>;
let warn: ReturnType<typeof vi.spyOn>;
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  navigateEdit = vi.fn(async () => ({ success: true }));
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  resetStaticParamsWarnings();
});

afterEach(() => {
  warn.mockRestore();
  consoleError.mockRestore();
});

/** One member action, as an author writes it inside a container's `actions`. */
function member(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { name: 'edit', label: 'Edit', type: 'navigate_edit', ...extra };
}

/** Render `schema` on a record page bound to {@link ROW}. */
function renderOnRecordPage(schema: Record<string, unknown>) {
  return render(
    <ActionProvider handlers={{ navigate_edit: navigateEdit }}>
      <RecordContextProvider objectName="account" recordId={ROW.id} data={ROW}>
        <SchemaRenderer schema={schema as unknown as BaseSchema} />
      </RecordContextProvider>
    </ActionProvider>,
  );
}

/** Radix opens a dropdown on `pointerdown` and mounts its content in a portal. */
async function selectFromMenu(trigger: HTMLElement, label: string) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
  const menu = await screen.findByRole('menu');
  fireEvent.click(within(menu).getByRole('menuitem', { name: label }));
}

/** How the member is reached once its container is on screen. */
type Reach = (label: string) => Promise<void>;

const clickButton: Reach = async (label) => {
  fireEvent.click(screen.getByRole('button', { name: label }));
};

const viaTrigger = (triggerName: string): Reach => async (label) => {
  await selectFromMenu(screen.getByRole('button', { name: triggerName }), label);
};

/** Every path a container member reaches the runner by. */
const CONTAINERS: ReadonlyArray<{
  path: string;
  schema: (m: Record<string, unknown>) => Record<string, unknown>;
  reach: Reach;
}> = [
  {
    path: 'action:bar, inline member',
    schema: (m) => ({ type: 'action:bar', actions: [m] }),
    reach: clickButton,
  },
  {
    path: 'action:bar, member drawn as an icon (`component: action:icon`)',
    schema: (m) => ({ type: 'action:bar', actions: [{ ...m, component: 'action:icon' }] }),
    reach: clickButton,
  },
  {
    path: 'action:bar, member placed in a button group (`component: action:group`)',
    schema: (m) => ({ type: 'action:bar', actions: [{ ...m, component: 'action:group' }] }),
    reach: clickButton,
  },
  {
    path: 'action:bar, member placed in the overflow menu (`component: action:menu`)',
    schema: (m) => ({ type: 'action:bar', actions: [{ ...m, component: 'action:menu' }] }),
    reach: viaTrigger(MORE),
  },
  {
    path: 'action:bar, member spilled past `maxVisible` into the overflow menu',
    schema: (m) => ({
      type: 'action:bar',
      maxVisible: 1,
      mobileMaxVisible: 1,
      actions: [{ name: 'first', label: 'First', type: 'navigate_edit' }, m],
    }),
    reach: viaTrigger(MORE),
  },
  {
    path: 'action:group, inline display',
    schema: (m) => ({ type: 'action:group', actions: [m] }),
    reach: clickButton,
  },
  {
    path: 'action:group, dropdown display',
    schema: (m) => ({ type: 'action:group', display: 'dropdown', label: 'Group', actions: [m] }),
    reach: viaTrigger('Group'),
  },
  {
    path: 'action:menu',
    schema: (m) => ({ type: 'action:menu', actions: [m] }),
    reach: viaTrigger(MORE),
  },
];

/** Mount, reach the member, return the `params` the handler received. */
async function paramsReceived(schema: Record<string, unknown>, reach: Reach): Promise<unknown> {
  renderOnRecordPage(schema);
  await reach('Edit');
  await waitFor(() => expect(navigateEdit).toHaveBeenCalledTimes(1));
  return (navigateEdit.mock.calls[0][0] as ActionDef).params;
}

describe('objectui#10290 - a container member\'s `properties.params` is evaluated where `properties` are', () => {
  it('CONTROL: a top-level `action:button` resolves `${record.id}` through the SchemaRenderer memo', async () => {
    const params = await paramsReceived(
      {
        type: 'action:button',
        name: 'edit',
        label: 'Edit',
        actionType: 'navigate_edit',
        properties: { params: AUTHORED },
      },
      clickButton,
    );
    expect(params).toEqual(RESOLVED);
  });

  describe.each(CONTAINERS)('$path', ({ schema, reach }) => {
    it('the handler receives `properties.params` with `${record.id}` resolved', async () => {
      const params = await paramsReceived(schema(member({ properties: { params: AUTHORED } })), reach);
      expect(params).toEqual(RESOLVED);
    });

    it('a node-level `params` OBJECT is still not a values channel, and says so once (objectui#10289)', async () => {
      const params = await paramsReceived(schema(member({ params: AUTHORED })), reach);
      expect(params).toBeUndefined();
      const lines = warn.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .filter((m: string) => m.includes('action "edit"') && m.includes('`params`'));
      expect(lines).toHaveLength(1);
    });
  });
});
