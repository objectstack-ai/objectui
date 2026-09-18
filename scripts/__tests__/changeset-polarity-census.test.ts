import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ABSENT_CONTROL_KEY,
  MEMBER_CONTROL_KEY,
  MEMBER_CONTROL_SCHEMA,
  PRESENT_DECLARATION,
  backtickedKeys,
  buildMemberIndex,
  census,
  clauseTexts,
  cutSentences,
  isQuotedInline,
  matchesPopulation,
  readClaim,
  readPolarity,
  runControls,
  segmentSentences,
} from '../changeset-polarity-census.mjs';

/**
 * objectui#9727 -- the REBUILT polarity instrument.
 *
 * The card this file serves does not ask for 53 changeset repairs. It asks for
 * an instrument, because the numbers it carries are TRANSCRIBED: the script that
 * produced them was cleaned up with its author's worktree, so nothing on the
 * card is re-derivable, and acting on a candidate table nobody has run is how a
 * second generation of false records gets made.
 *
 * ⭐ And the transcribed instrument had a PROVEN FALSE NEGATIVE: it missed THE
 * SITE THAT MOTIVATED THE CARD, because that claim's object is the pronoun
 * `them`, resolved across a sentence boundary. An instrument blind to the shape
 * that produced it is not a census, and its output was a FLOOR.
 *
 * What this file pins, in the order the instrument can go wrong:
 *
 *  1. THE CLOSED BLINDNESS. The motivating site, by its PRE-REPAIR text, is
 *     FOUND -- and found with exactly the keys objectui#9713 adjudicated. This
 *     is the pin that goes red if the blindness returns.
 *  2. QUOTATION. The same sentence, in the quoted position objectui#9713's
 *     repair actually put it in, is reported and NEVER flagged. Without this
 *     the instrument re-flags every site this lane has already repaired.
 *  3. WHITESPACE. A claim that wraps at eighty columns -- where this corpus
 *     wraps -- reads as one sentence. A line-anchored probe reads nothing.
 *  4. (interface, name). A key of a REFERENCED schema is not a member of the
 *     referrer, and an inherited index signature is not membership either.
 *  5. TENSE. A bare past-tense sentence is historical, cannot rot, and is out.
 *  6. CONTROLS. A lit control and an absent control, and -- the leg that makes
 *     the zeros mean anything -- a FAILED control voids the run.
 *  7. IT DOES NOT ANSWER ABOUT ITSELF. The corpus is `.changeset/` and nothing
 *     else, so the script cannot match its own docstring or these fixtures.
 *  8. POLARITY IS A CLAUSE PROPERTY (objectui#9754). A negator that belongs to
 *     another clause does not invert the verdict on a key this sentence
 *     asserts -- and, the other leg, a negator that DOES scope the declaration
 *     verb still does. Without the second leg the repair would have traded
 *     false positives for false negatives, which is the failure this whole
 *     family of cards is about.
 *
 * Every pin except 6 and 7 runs against FIXTURES, deliberately. The live
 * `packages/types/src` moves whenever a card declares a member -- which is the
 * event the census exists to notice -- so a pin read from it would go red for
 * the tree's reasons rather than the instrument's.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../..');
const FIXTURE_CORPUS = path.join(HERE, 'fixtures', 'changeset-polarity', 'corpus');
const FIXTURE_TYPES = path.join(HERE, 'fixtures', 'changeset-polarity', 'types');
const SCRIPT = path.join(REPO_ROOT, 'scripts/changeset-polarity-census.mjs');

const fixtureIndex = buildMemberIndex(FIXTURE_TYPES);
const fixtureRun = census({ corpusDir: FIXTURE_CORPUS, memberIndex: fixtureIndex });

const flagsFor = (entryPrefix: string) =>
  fixtureRun.contradictions.filter((c) => c.entry.startsWith(entryPrefix));

describe('objectui#9727 pin 1 -- the closed blindness: the cross-sentence pronoun', () => {
  /**
   * The pre-repair text of
   * `.changeset/8802-8257-8008-kanban-gantt-family-retirement.md`, whose claim
   * reads "The surviving `ObjectKanbanSchema` face declares none of them" with
   * the keys named in the PREVIOUS sentence. The fixture carries the text so the
   * pin survives a shallow clone, where `adf581278` may not be reachable.
   */
  const flags = flagsFor('01-pronoun-pre-repair');

  it('FINDS the site the transcribed instrument missed', () => {
    expect(
      flags.length,
      'the motivating site read ZERO -- the blindness this card is about has returned',
    ).toBeGreaterThan(0);
  });

  it('resolves the object ACROSS the sentence boundary, not inside the sentence', () => {
    // The load-bearing half. A flag reached without pronoun resolution would
    // mean the sentence carried its own key, which this sentence does not --
    // and the instrument would still be blind to the shape.
    expect(flags.every((f) => f.viaPronoun)).toBe(true);
  });

  it('finds EXACTLY the keys objectui#9713 adjudicated, and no others', () => {
    // objectui#9713 ruled `columns` and `cardTitle` ROTTED, `titleField` and
    // `allowCollapse` BORN FALSE. The other keys that sentence names are
    // genuinely absent from the surviving face, so a NEGATIVE claim about them
    // is true and must NOT be flagged. Reproducing that adjudication from a
    // fixture is the strongest available evidence the rebuild reads correctly.
    expect(flags.map((f) => f.key).sort()).toEqual([
      'allowCollapse',
      'cardTitle',
      'columns',
      'titleField',
    ]);
    expect(flags.every((f) => f.polarity === 'negative')).toBe(true);
    expect(flags.every((f) => f.schema === 'ObjectKanbanSchema')).toBe(true);
  });

  it('reads the claim directly, so the pin names the mechanism and not just the count', () => {
    const sentences = segmentSentences(
      fs.readFileSync(
        path.join(HERE, 'fixtures', 'changeset-polarity', 'corpus', '01-pronoun-pre-repair.md'),
        'utf8',
      ),
    );
    const claimSentence = sentences.find((s) => /declares none of them/.test(s.text));
    expect(claimSentence, 'the claim sentence itself went missing from the segmentation').toBeTruthy();
    const preceding = sentences.filter(
      (s) =>
        s.paragraphIndex === claimSentence!.paragraphIndex &&
        s.sentenceIndex < claimSentence!.sentenceIndex,
    );
    // The sentence carries a schema and a verb and NO key of its own -- which
    // is precisely why a sentence-local matcher reports nothing here.
    expect(backtickedKeys(claimSentence!.text)).toEqual([]);
    const claim = readClaim(claimSentence!, preceding);
    expect(claim.viaPronoun).toBe(true);
    expect(claim.polarity).toBe('negative');
    expect(claim.keys).toContain('columns');
    expect(claim.antecedent).toMatch(/refused/);
  });
});

describe('objectui#9727 pin 2 -- assertion position is not quoted position', () => {
  it('the retired sentence, quoted in guillemets, is NEVER flagged', () => {
    expect(flagsFor('02-quotation-position')).toEqual([]);
  });

  it('but it IS counted, so quotation hides nothing from the report', () => {
    expect(fixtureRun.matchedQuoted).toBeGreaterThan(0);
    expect(fixtureRun.quoted.some((q) => q.entry.startsWith('02-quotation-position'))).toBe(true);
  });

  it('a blockquote is the other quoted position', () => {
    const sentences = segmentSentences(
      fs.readFileSync(
        path.join(HERE, 'fixtures', 'changeset-polarity', 'corpus', '02-quotation-position.md'),
        'utf8',
      ),
    );
    const blockquoted = sentences.find((s) => /said by someone else/.test(s.text));
    expect(blockquoted?.position).toBe('quoted');
  });

  it('and the detector fires on the wrapper, not on the words', () => {
    expect(isQuotedInline('«The surviving face declares none of them»')).toBe(true);
    expect(isQuotedInline('The surviving face declares none of them.')).toBe(false);
  });
});

describe('objectui#9727 pin 3 -- whitespace tolerance over a corpus that wraps', () => {
  it('a claim split across lines is found', () => {
    const flags = flagsFor('03-wrapped-assertion');
    expect(flags.map((f) => `${f.schema}.${f.key}`)).toEqual(['SpinnerSchema.color']);
  });

  it('LIT/DARK: the same corpus read line-anchored reads NOTHING on that entry', () => {
    // The dark leg, and it is the reason this pin exists rather than being
    // assumed. `git grep` is line-anchored; on this exact shape no single line
    // carries both the schema and the verb, so a line-anchored probe answers 0
    // while the truth is 1.
    const body = fs.readFileSync(
      path.join(HERE, 'fixtures', 'changeset-polarity', 'corpus', '03-wrapped-assertion.md'),
      'utf8',
    );
    const lineAnchored = body
      .split('\n')
      .filter((line) => /SpinnerSchema/.test(line) && PRESENT_DECLARATION.test(line));
    expect(lineAnchored, 'a line-anchored probe must be BLIND here, or this pin proves nothing').toEqual([]);

    const wholeFile = segmentSentences(body).filter((s) => matchesPopulation(s.text));
    expect(wholeFile.length).toBe(1);
  });

  it('a sentence is not cut inside a backticked span', () => {
    expect(cutSentences('It reads `foo.md` and stops. Then more.')).toEqual([
      'It reads `foo.md` and stops.',
      'Then more.',
    ]);
  });
});

describe('objectui#9727 pin 4 -- a name is not a key; a key is (interface, name)', () => {
  it("a referenced schema's members are ITS members, never the referrer's", () => {
    const board = fixtureIndex.get('ObjectKanbanSchema');
    const lane = fixtureIndex.get('LaneSchema');
    expect(lane?.members.has('cards')).toBe(true);
    expect(
      board?.members.has('cards'),
      "a lane's key read as the board's is the over-approximation that inflates the count",
    ).toBe(false);
    expect(board?.members.has('columns')).toBe(true);
    expect(flagsFor('05-referenced-schema-scoping')).toEqual([]);
  });

  it('an inherited index signature is NOT membership', () => {
    const board = fixtureIndex.get('ObjectKanbanSchema');
    expect(board?.indexSignature, 'the fixture base face must carry one, or this pin is vacuous').toBe(true);
    // `swimlaneField` rides the index signature: admitted, never examined. If
    // the index signature counted as membership this flag would disappear, and
    // with it the entire finding this family of cards is about.
    expect(flagsFor('06-index-signature').map((f) => f.key)).toEqual(['swimlaneField']);
  });

  it('inherited members ARE membership', () => {
    const board = fixtureIndex.get('ObjectKanbanSchema');
    expect(board?.members.has('className')).toBe(true);
  });
});

describe('objectui#9727 pin 5 -- a past-tense sentence cannot rot, so it is out of P', () => {
  it('bare past `declared` does not enter the population', () => {
    expect(flagsFor('04-past-tense-only')).toEqual([]);
    expect(matchesPopulation('`SpinnerSchema` declared `color` when it was introduced.')).toBe(false);
  });

  it('but present-tense PASSIVE does -- it is a live claim and rots like the rest', () => {
    expect(matchesPopulation('`color` is declared on `SpinnerSchema` today.')).toBe(true);
    expect(matchesPopulation('`SpinnerSchema` declares `color`.')).toBe(true);
  });
});

describe('objectui#9727 pin 6 -- the controls, and what makes a zero mean anything', () => {
  it('lit and absent both read as expected on the fixture corpus', () => {
    const controls = runControls({ corpusDir: FIXTURE_CORPUS, memberIndex: fixtureIndex });
    expect(controls.corpusLit.reading).toBeGreaterThan(0);
    expect(controls.corpusAbsent.reading).toBe(0);
    expect(controls.memberLit.reading).toBe(1);
    expect(controls.memberAbsent.reading).toBe(0);
    expect(controls.memberAbsent.probe).toContain(ABSENT_CONTROL_KEY);
    expect(controls.ok).toBe(true);
  });

  it('the member control is pinned to a STABLE fact, not to one a card can move', () => {
    /**
     * ⭐ Recorded because this instrument got it wrong first. The member control
     * was originally `ObjectKanbanSchema.groupBy` -- a member objectui#7322
     * added -- so running the census at a write-time ref older than that card
     * read 0 and voided every historical run, which is exactly the run you need
     * in order to establish BORN FALSE. A control pinned to a fact a later card
     * moves is THIS CARD'S OWN DEFECT CLASS wearing the instrument's clothes.
     */
    expect(MEMBER_CONTROL_SCHEMA).toBe('BaseSchema');
    expect(MEMBER_CONTROL_KEY).toBe('type');
  });

  it('a FAILED control voids the run -- exit 2, not a clean zero', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'polarity-control-'));
    try {
      const emptyTypes = path.join(dir, 'types');
      fs.mkdirSync(emptyTypes);
      fs.writeFileSync(path.join(emptyTypes, 'nothing.ts'), 'export const x = 1;\n');
      const outcome = run(['--corpus', FIXTURE_CORPUS, '--types', emptyTypes]);
      expect(outcome.status, 'a dead member index must NOT exit 0').toBe(2);
      expect(outcome.stdout).toContain('CONTROLS FAILED');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('an unreadable input exits 1 -- "measured nothing" is not "measured zero"', () => {
    const outcome = run(['--corpus', path.join(os.tmpdir(), 'no-such-corpus-9727')]);
    expect(outcome.status).toBe(1);
    expect(outcome.stderr).toContain('measured nothing');
  });
});

describe('objectui#9727 -- every fixture in the corpus is exercised', () => {
  it('no fixture sits in the tree unread', () => {
    // A fixture nobody reads is a document that looks like evidence and is not.
    // The walk is also what makes this test an honest `markdown-tree` reader in
    // `scripts/markdown-test-inputs.mjs`'s ledger.
    const fixtures = readdirSync(FIXTURE_CORPUS).filter((name) => name.endsWith('.md')).sort();
    expect(fixtures.length).toBeGreaterThanOrEqual(6);
    expect(fixtureRun.entriesScanned).toBe(fixtures.length);
    for (const name of fixtures) {
      const prefix = name.replace(/\.md$/, '');
      const touched =
        fixtureRun.matched.some((m) => m.entry === name) ||
        fixtureRun.quoted.some((q) => q.entry === name) ||
        flagsFor(prefix).length > 0 ||
        /past-tense|scoping/.test(name);
      expect(touched, `${name} is never reached by any pin`).toBe(true);
    }
  });
});

describe('objectui#9727 pin 7 -- the probe does not answer about itself', () => {
  it('the default corpus is `.changeset/` and the script is not inside it', () => {
    const outcome = run([]);
    expect(outcome.status, outcome.stderr).toBe(0);
    expect(outcome.stdout).toContain('Controls PASS');
    // Every reported entry is a pending changeset. A tree-wide scan would match
    // this script's own docstring -- which names schemas and declaration verbs
    // in every paragraph -- and these fixtures, and report itself.
    for (const line of outcome.stdout.split('\n')) {
      if (!line.startsWith('- ')) continue;
      const entry = line.slice(2).split(' ')[0];
      expect(
        fs.existsSync(path.join(REPO_ROOT, '.changeset', entry)),
        `${entry} is not a pending changeset -- the corpus boundary leaked`,
      ).toBe(true);
    }
  });

  it('runs from a clean checkout: no build, no workspace state, plain node', () => {
    // The card's stated defect in the instrument it replaces was that it could
    // not be re-run at all. This asserts the replacement has no such dependency.
    const outcome = run(['--json']);
    expect(outcome.status).toBe(0);
    const payload = JSON.parse(outcome.stdout);
    expect(payload.controls.ok).toBe(true);
    expect(payload.result.entriesScanned).toBeGreaterThan(300);
  });
});

function run(args: string[]) {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { status: e.status ?? -1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

describe('objectui#9754 pin 8 -- polarity belongs to the clause that carries the verb', () => {
  /**
   * The instrument names this false-positive source on itself, under
   * "The three limits that produce this instrument's false positives": a
   * sentence carrying `no` / `not` / `none` for an UNRELATED clause was read
   * as a negative claim and the verdict inverted on a key the sentence asserts.
   *
   * `07-polarity-clause-scope.md` carries all three shapes in one entry, so the
   * two legs of the repair are pinned against ONE reading of ONE fixture:
   * the false positive must go, and the true negative claim must stay.
   */
  const flags = flagsFor('07-polarity-clause-scope');

  it('does NOT invert on a negator that belongs to another clause', () => {
    // "There is no mirror entry ..., so `ObjectKanbanSchema` declares
    // `cardTitle`" asserts `cardTitle`, which the face declares. Read
    // sentence-wide it was a NEGATIVE claim about a present member -- a flag.
    expect(flags.map((f) => f.key)).not.toContain('cardTitle');
    // DARK LEG: the sentence really does carry a negator, or this pin is
    // vacuous and would pass against the instrument it is here to distinguish.
    const sentence = fixtureSentence('07-polarity-clause-scope.md', /mirror entry/);
    expect(/\bno\b/i.test(sentence.text)).toBe(true);
    expect(readPolarity(sentence.text).byKey.cardTitle).toBe('positive');
  });

  it('keeps each half of a coordinated claim on its own polarity', () => {
    // "`ObjectKanbanSchema` declares `columns` and no `titleField`" asserts
    // one key and denies the other. `columns` is declared, so the assertion is
    // true; `titleField` is declared, so the DENIAL is false and is the flag.
    const sentence = fixtureSentence('07-polarity-clause-scope.md', /and no /);
    const reading = readPolarity(sentence.text);
    expect(reading.byKey.columns).toBe('positive');
    expect(reading.byKey.titleField).toBe('negative');
    expect(flags.map((f) => f.key)).not.toContain('columns');
    expect(flags.map((f) => f.key)).toContain('titleField');
  });

  it('a negator that DOES scope the verb still reads negative -- the no-trade leg', () => {
    // Without this the repair would buy its precision with false negatives.
    const sentence = fixtureSentence('07-polarity-clause-scope.md', /surviving face/);
    expect(readPolarity(sentence.text).byKey.allowCollapse).toBe('negative');
    expect(flags.map((f) => f.key)).toContain('allowCollapse');
  });

  it('the whole entry reads exactly the two denials and neither assertion', () => {
    expect(flags.map((f) => f.key).sort()).toEqual(['allowCollapse', 'titleField']);
    expect(flags.every((f) => f.polarity === 'negative')).toBe(true);
    expect(flags.every((f) => f.memberPresent)).toBe(true);
  });

  it('names the cut, not just the outcome', () => {
    // A pin that only checked the verdict could be satisfied by any mechanism,
    // including one that stopped reading polarity at all. This names the clause
    // boundary the reading is built on.
    expect(clauseTexts('It has no mirror entry today, so `S` declares `k`.')).toEqual([
      'It has no mirror entry today,',
      '`S` declares `k`.',
    ]);
    expect(clauseTexts('`S` declares `a` and no `b`.')).toEqual([
      '`S` declares `a`',
      'no `b`.',
    ]);
  });

  it('a key resolved ACROSS a sentence boundary takes the verb\'s own clause', () => {
    // The pronoun case has no clause in this sentence to sit in, so it falls
    // back to the sentence's first declaration clause -- which is the clause
    // its verb is in. Pin 1 depends on this staying negative.
    const reading = readPolarity('The surviving `ObjectKanbanSchema` face declares none of them.');
    expect(reading.polarity).toBe('negative');
    expect(Object.keys(reading.byKey)).toEqual([]);
  });
});

/** One sentence of one fixture, by the text that identifies it. */
function fixtureSentence(file: string, match: RegExp) {
  const sentences = segmentSentences(
    fs.readFileSync(path.join(FIXTURE_CORPUS, file), 'utf8'),
  );
  const found = sentences.find((s) => match.test(s.text));
  expect(found, `no sentence of ${file} matches ${match} -- the fixture moved`).toBeTruthy();
  return found!;
}
