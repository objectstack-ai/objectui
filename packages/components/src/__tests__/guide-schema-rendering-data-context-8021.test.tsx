/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The guide's Data Context passages teach a wiring that RESOLVES (objectui#8021).
 *
 * ## The two independent errors this file holds apart
 *
 * `SchemaRendererProps` declares exactly ONE prop, `schema`
 * (`packages/react/src/SchemaRenderer.tsx`). The docblock beside it names the
 * mechanism: the renderer "passes every prop it does not itself read straight
 * through to the component the schema names". So a `data={…}` written on a
 * `SchemaRenderer` element is not ignored and does not warn — it is FORWARDED,
 * and the evaluator never sees it.
 *
 * The evaluator's scope is built from `usePredicateScope()` plus
 * `current_user`, an optional `record`, `data: dataSource` and
 * `page: pageVariables`, where `dataSource` comes from
 * `SchemaRendererProvider`. So a host's own values are reachable only under the
 * `data.` prefix, and a bare `${user.…}` addresses the AMBIENT signed-in user
 * an `ExpressionProvider` publishes — never the object the page handed over.
 *
 * Two coordinates, and the page had both wrong. A repair that moves only one
 * leaves it broken, which is why legs B and D below are LIT CONTROLS rather
 * than commentary:
 *
 *   | leg | wiring                | expression            | rendered                |
 *   |-----|-----------------------|-----------------------|-------------------------|
 *   | A   | what the page teaches | what the page teaches | must be `Welcome, John!`|
 *   | B   | `data` prop           | `data.` prefix        | `Welcome, !`            |
 *   | C   | provider `dataSource` | `data.` prefix        | `Welcome, John!`        |
 *   | D   | provider `dataSource` | bare `user.`          | the raw source text     |
 *
 * B proves the prop supplies nothing even when the expression is right; D
 * proves the prefix is needed even when the wiring is right. Leg A is not
 * transcribed from the page — it is READ OFF the page on every run, so it can
 * only go green when both coordinates have moved.
 *
 * ## Why leg A is derived rather than listed
 *
 * A transcription of the fence is a second copy that drifts, and the anchors on
 * this card already drifted twice before it was dispatched. The wiring half is
 * read from the `## Data Context` fence and the expression half from the
 * `### Accessing Data in Schemas` fence, then RENDERED. Edit either passage
 * back and this file reddens.
 *
 * ⚠️ `content/docs/**` is EXCLUDED from `ci.yml`'s full-run decision on
 * `pull_request`, so a green PR page is not evidence that this file ran on a
 * docs-only edit. It lives in `packages/components` for the same reason
 * `guide-layout-page-buttons-7926.test.tsx` does, and the document is declared
 * in `scripts/markdown-test-inputs.mjs`.
 *
 * Module-scope import of the renderers, not `beforeAll` (AGENTS.md 测试纪律):
 * registering them is an unbounded module load and must not be billed to a
 * bounded hook timeout.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import '../renderers';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';

/**
 * Anchored on this file's own naked `import.meta.url`, never on
 * `process.cwd()`: the cwd differs between a repo-root vitest invocation and a
 * package-level one, and an assertion that reads the filesystem would otherwise
 * grade a different tree depending on how it was started (AGENTS.md).
 */
function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 12; i += 1) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = resolve(dir, '..');
  }
  throw new Error('repo root (pnpm-workspace.yaml) not found from this test file');
}

const ROOT = repoRoot();
const GUIDE = 'content/docs/guide/schema-rendering.md';
const readDoc = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

/** The host scope every leg is given: as a `dataSource`, or as the `data` prop. */
const SCOPE = { user: { name: 'John', role: 'admin' }, stats: { totalUsers: 1234 } };

const textNode = (content: string) => ({ type: 'text', content });

/**
 * Leg A/B wiring: the prop the page used to teach, with no provider above it.
 *
 * ⭐ No cast is needed, and that is itself the measurement: `SchemaRenderer`'s
 * declared type is `SchemaRendererProps & Record<string, any>`, the open
 * forwarding surface. TypeScript therefore ACCEPTS `data` here — the prop is
 * not rejected anywhere, at compile time or at runtime. It is simply handed to
 * whatever component the schema names.
 */
function renderWithDataProp(content: string): string {
  return render(<SchemaRenderer schema={textNode(content)} data={SCOPE} />).container.textContent ?? '';
}

/** Leg C/D wiring: the provider that actually seeds the evaluator. */
function renderWithProvider(content: string): string {
  return (
    render(
      <SchemaRendererProvider dataSource={SCOPE}>
        <SchemaRenderer schema={textNode(content)} />
      </SchemaRendererProvider>,
    ).container.textContent ?? ''
  );
}

// ---------------------------------------------------------------------------
// Reading the page
// ---------------------------------------------------------------------------

/** The slice of `src` from `heading` to the next heading at the same level. */
function sectionOf(src: string, heading: string): string {
  const level = /^#+/.exec(heading)?.[0].length ?? 2;
  const start = src.indexOf(`\n${heading}\n`);
  if (start < 0) throw new Error(`heading not found: ${heading}`);
  const rest = src.slice(start + 1 + heading.length);
  const next = new RegExp(`\\n#{1,${level}} `).exec(rest);
  return rest.slice(0, next ? next.index : undefined);
}

/** The body of the first fenced block in `src` opened with `lang`. */
function firstFence(src: string, lang: string): string {
  const re = new RegExp('```' + lang + '\\s*\\n([\\s\\S]*?)\\n```');
  const m = re.exec(src);
  if (!m) throw new Error(`no \`\`\`${lang} fence in the section`);
  return m[1];
}

/**
 * Every `<SchemaRenderer …/>` element in a document.
 *
 * `\b` after the name is what keeps `SchemaRendererProvider` out of the set:
 * the character after `SchemaRenderer` there is `P`, a word character, so the
 * boundary does not match. The provider is the CORRECT carrier for these props
 * and must not be counted as an offender.
 */
function schemaRendererElements(src: string): string[] {
  return src.match(/<SchemaRenderer\b[\s\S]*?\/>/g) ?? [];
}

/**
 * The three props that LOOK like evaluator wiring and are not: `SchemaRenderer`
 * reads none of them. `data` and `dataSource` reach the evaluator only through
 * `SchemaRendererProvider`; `debug` is read off the same context
 * (`SchemaRenderer.tsx`: `context?.debug || context?.debugFlags?.enabled`).
 * Written on the element they are forwarded to whatever component the schema
 * names — silently.
 */
const FORWARDED_LOOKALIKES = /\b(data|dataSource|debug)=\{/;

/**
 * The teaching surfaces this repair covers IN FULL. Not a glob: each document
 * was read and repaired by hand, and a new page inheriting the pin by accident
 * is the failure mode a glob would create.
 *
 * ⚠️ Three more documents carry the same element and are deliberately NOT here.
 * The sweep this card's triage asked for was run BEFORE any writing, and it
 * measured 18 `<SchemaRenderer …/>` elements across five surfaces, nine of them
 * carrying a forwarded look-alike. On `content/docs/guide/expressions.md`,
 * `content/docs/guide/architecture.md` and the root `README.md` the element is
 * only half the defect: their expression spellings are bare across the whole
 * page (about fifty sites on `expressions.md` alone), and several of those are
 * legitimate AMBIENT `user` references rather than data-scope ones. Moving only
 * the wiring there would produce exactly leg D — a page that reads as repaired
 * and still prints raw source — so that population is filed as its own card
 * with the census rather than half-moved here. The two documents below are the
 * ones where every site in the passage moves together.
 */
const TEACHING_SURFACES = [GUIDE, 'packages/react/README.md'];

afterEach(cleanup);

describe('objectui#8021 leg A — the guide’s own pair, read off the page', () => {
  it('renders the resolved value, not the characters the author typed', () => {
    const src = readDoc(GUIDE);
    const dataContext = sectionOf(src, '## Data Context');
    const wiringFence = firstFence(dataContext, 'tsx');
    const accessing = sectionOf(dataContext, '### Accessing Data in Schemas');
    const node = JSON.parse(firstFence(accessing, 'json')) as { content?: string };

    // Lit control on the READER: a silent parse failure would otherwise make
    // this leg pass by measuring nothing.
    expect(node.content, 'the Accessing Data fence must carry a `content` string').toEqual(
      expect.stringContaining('${'),
    );
    expect(wiringFence, 'the Data Context fence must show a SchemaRenderer').toContain(
      'SchemaRenderer',
    );

    const teachesProvider = /<SchemaRendererProvider[\s\S]*?\bdataSource=\{/.test(wiringFence);
    const rendered = teachesProvider
      ? renderWithProvider(node.content as string)
      : renderWithDataProp(node.content as string);

    expect(rendered).toBe('Welcome, John!');
  });
});

describe('objectui#8021 legs B–D — the controls that keep the two errors apart', () => {
  it('leg B: the `data` prop supplies nothing even with the `data.` prefix', () => {
    expect(renderWithDataProp('Welcome, ${data.user.name}!')).toBe('Welcome, !');
  });

  it('leg C: provider `dataSource` plus the `data.` prefix is the green wiring', () => {
    expect(renderWithProvider('Welcome, ${data.user.name}!')).toBe('Welcome, John!');
  });

  it('leg D: the right wiring still prints raw source for a bare `${user.…}`', () => {
    // Nothing published `user` here, so the template is unresolvable and the
    // evaluator hands back its own SOURCE TEXT — the failure the reader sees.
    expect(renderWithProvider('Welcome, ${user.name}!')).toBe('Welcome, ${user.name}!');
  });
});

describe('objectui#8021 sweep — no repaired surface hands SchemaRenderer wiring props', () => {
  it.each(TEACHING_SURFACES)('%s', (doc) => {
    const elements = schemaRendererElements(readDoc(doc));
    // Lit control, per document: a scanner that stopped matching would report
    // an empty offender list, which is indistinguishable from a clean page.
    expect(elements.length, `no <SchemaRenderer …/> element found in ${doc}`).toBeGreaterThan(0);
    expect(elements.filter((el) => FORWARDED_LOOKALIKES.test(el))).toEqual([]);
  });
});
