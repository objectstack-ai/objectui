// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Add a field the way the Data pillar's header offers it (objectui#12450).
 *
 * Add field left the object header row for the header's More menu, so a suite
 * that adds a field "from the header" opens that menu first and picks the
 * entry. The real Radix menu opens on a pointer press, which `fireEvent.click`
 * does not send, so both steps go through `userEvent`. Read by test id, not by
 * name, so a suite rendered under another locale reaches the same entry.
 *
 * More is drawn exactly when Add field is offered (its one entry; see the
 * header in `DataPillar`, pinned both ways by
 * `DataPillar.flatTabs-12450.test.tsx`), so {@link ADD_FIELD_OFFERED} is the
 * id a suite reads to ask "is Add field offered here?" — the question the
 * header button's title used to answer.
 */

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** The More trigger's test id; present exactly when Add field is offered. */
export const ADD_FIELD_OFFERED = 'data-object-more';

/**
 * Open the header's More menu and pick Add field. `scope` is the editor whose
 * More to open when a suite renders more than one; the menu itself portals to
 * the document, and only one is open at a time.
 */
export async function addFieldFromMoreMenu(scope?: HTMLElement): Promise<void> {
  const where = scope ? within(scope) : screen;
  await userEvent.click(await where.findByTestId(ADD_FIELD_OFFERED));
  await userEvent.click(await screen.findByTestId('data-object-add-field'));
}
