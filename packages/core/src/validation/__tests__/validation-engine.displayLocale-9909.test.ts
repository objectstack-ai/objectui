/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `date_min` / `date_max` print their bound in the locale the caller THREADS,
 * never only in the machine's (objectui#9909).
 *
 * The engine is a plain class — no hook to read — so the display locale
 * arrives on `ValidationContext.locale`, the parameter-threading shape
 * `formatDisplayNumber` already uses in this package. Before it existed there
 * was no way to pass one, and every default message printed its bound in the
 * machine's locale.
 *
 * Measured as a DIFFERENCE: the same violation under two declared locales must
 * read differently — a literal would measure the runner, on which a broken
 * engine and a repaired one print the same bytes. The runtime tripwire then
 * checks the argument the date formatting actually received.
 */

import { describe, it, expect } from 'vitest';
import { isMachineLocale, recordLocaleArgumentsAsync } from '@object-ui/test-support';
import { ValidationEngine } from '../validation-engine';

const BOUND = '2020-03-04T12:00:00.000Z';
const TOO_EARLY = '2020-01-01T12:00:00.000Z';
const TOO_LATE = '2020-06-01T12:00:00.000Z';

const RULES = [
  { name: 'date_min', value: TOO_EARLY, de: /Date must be after 4\.3\.2020/, en: /Date must be after 3\/4\/2020/ },
  { name: 'date_max', value: TOO_LATE, de: /Date must be before 4\.3\.2020/, en: /Date must be before 3\/4\/2020/ },
] as const;

async function messageUnder(locale: string, rule: (typeof RULES)[number]): Promise<string> {
  const result = await new ValidationEngine().validate(
    rule.value,
    { field: 'closed_at', rules: [{ type: rule.name, params: BOUND }] },
    { locale },
  );
  expect(result.valid).toBe(false);
  return result.errors[0]!.message;
}

describe('built-in date rules print their bound in the threaded locale (objectui#9909)', () => {
  it.each(RULES)('$name — says the de-DE face when de-DE is threaded', async (rule) => {
    expect(await messageUnder('de-DE', rule)).toMatch(rule.de);
  });

  it.each(RULES)('$name — keeps its en face when en is threaded', async (rule) => {
    expect(await messageUnder('en', rule)).toMatch(rule.en);
  });

  /** ⭐ THE PIN: the runner's own locale cannot satisfy it. */
  it.each(RULES)('$name — is a reading of the threaded locale, not of the machine', async (rule) => {
    expect(await messageUnder('de-DE', rule)).not.toBe(await messageUnder('en', rule));
  });

  it.each(RULES)('$name — the date formatting receives the threaded tag', async (rule) => {
    const calls = await recordLocaleArgumentsAsync(async () => {
      await new ValidationEngine().validate(
        rule.value,
        { field: 'closed_at', rules: [{ type: rule.name, params: BOUND }] },
        { locale: 'de-DE' },
      );
    });
    expect(calls.map((c) => c.locale)).toContain('de-DE');
    expect(calls.filter(isMachineLocale)).toEqual([]);
  });
});
