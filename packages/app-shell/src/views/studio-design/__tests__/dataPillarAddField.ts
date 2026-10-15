// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Add a field the way the Data pillar offers it (objectui#12511).
 *
 * The object header holds no Add field: the action lives where fields are laid
 * out, and both entries run the pillar's one `addField`:
 *
 * - the Records grid's own "+" column, the `grid-add-column` button the grid
 *   draws from its authoring context (`GridFieldAuthoringProvider` hands it
 *   `onAddColumn` only on a writable package). A suite that stubs the grid
 *   draws the same test id from the same context, so its double stands in for
 *   that column;
 * - the Form tab's toolbar in Layout, `form-toolbar` in `ObjectFormDesigner`.
 *
 * {@link ADD_FIELD_OFFERED} is the id a Records-tab suite reads to ask "is Add
 * field offered here?": the grid draws it exactly when the object is loaded
 * on a writable package.
 */

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { t } from '../../metadata-admin/i18n';

/** The Records grid's "+" column; present exactly when Add field is offered there. */
export const ADD_FIELD_OFFERED = 'grid-add-column';

/**
 * Pick the Records grid's "+" column. `scope` is the editor whose grid to use
 * when a suite renders more than one.
 */
export async function addFieldFromGrid(scope?: HTMLElement): Promise<void> {
  const where = scope ? within(scope) : screen;
  await userEvent.click(await where.findByTestId(ADD_FIELD_OFFERED));
}

/**
 * Pick Add field on the Form tab's toolbar (Layout). The suite has opened the
 * Form tab already; the toolbar's button carries no test id, so it is read by
 * its English label, the locale these suites render in.
 */
export async function addFieldFromFormToolbar(scope?: HTMLElement): Promise<void> {
  const where = scope ? within(scope) : screen;
  const toolbar = await where.findByTestId('form-toolbar');
  await userEvent.click(within(toolbar).getByRole('button', { name: t('engine.studio.data.addField', 'en') }));
}
