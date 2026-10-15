// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Add a field the way the Data pillar's header offers it (objectui#12450).
 *
 * Add field left the object header row for the header's More menu, so a suite
 * that adds a field "from the header" opens that menu first and picks the
 * entry. The real Radix menu opens on a pointer press, which `fireEvent.click`
 * does not send, so both steps go through `userEvent`. Read by test id, not by
 * name, so a suite rendered under another locale reaches the same entry.
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export async function addFieldFromMoreMenu(): Promise<void> {
  await userEvent.click(await screen.findByTestId('data-object-more'));
  await userEvent.click(await screen.findByTestId('data-object-add-field'));
}
