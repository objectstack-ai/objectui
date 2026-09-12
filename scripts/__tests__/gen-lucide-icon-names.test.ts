// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The checked-in icon catalogue is what the generator writes (objectui#9204).
 *
 * `packages/components/src/__tests__/lucide-icon-names-mirror-9204.test.ts`
 * holds the SEMANTIC half — the names in the catalogue are the names the
 * installed lucide ships. This file holds the mechanical half: running
 * `pnpm gen:lucide-icon-names` reproduces the file on disk byte for byte.
 *
 * Both are needed, and they fail for different reasons. A catalogue edited by
 * hand into the right SHAPE but the wrong bytes — a re-wrapped header, a
 * stripped `readonly`, names re-sorted "helpfully" — keeps the semantic test
 * green while making the generator's output a diff nobody expects. That is how
 * a generated file stops being regenerated.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CATALOGUE_PATH,
  loadInstalledIconNames,
  renderCatalogue,
} from '../gen-lucide-icon-names.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('the generated lucide icon catalogue', () => {
  it('is byte-identical to what the generator produces from the installed lucide', async () => {
    const { names } = await loadInstalledIconNames(repoRoot);
    const onDisk = fs.readFileSync(path.join(repoRoot, CATALOGUE_PATH), 'utf8');
    expect(
      renderCatalogue(names),
      `${CATALOGUE_PATH} is not what the generator writes — run \`pnpm gen:lucide-icon-names\``,
    ).toBe(onDisk);
  });

  /**
   * The control. `toBe` between two strings is only evidence if a WRONG input
   * would have produced a different string; a renderer that ignored its
   * argument would pass the row above forever.
   */
  it('renders a different file for a different vocabulary', async () => {
    const { names } = await loadInstalledIconNames(repoRoot);
    expect(renderCatalogue([...names, 'no-such-glyph-xyz'])).not.toBe(renderCatalogue(names));
    expect(renderCatalogue([...names, 'no-such-glyph-xyz'])).toContain('no-such-glyph-xyz');
  });

  it('names the repair in the file it writes', async () => {
    const { names } = await loadInstalledIconNames(repoRoot);
    expect(renderCatalogue(names)).toContain('pnpm gen:lucide-icon-names');
  });
});
