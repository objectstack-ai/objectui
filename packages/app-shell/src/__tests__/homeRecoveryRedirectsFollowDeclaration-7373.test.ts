/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * objectui#7373 — the "this app is gone / you may not be here" RECOVERY exits
 * follow the declared landing too, and no longer name `/home` literally.
 *
 * ## The defect, and why it is a separate card from objectui#7256
 *
 * #7256 (PR #7372) moved the four chrome Home AFFORDANCES — top-bar logo, both
 * sidebar Home rows, the app-switcher Home entry — onto `useHomePath()`, and
 * `homeAffordancesFollowDeclaration-7256.test.ts` pins them. It deliberately
 * left the recovery redirects alone, in those words, because retargeting them
 * moves a `/home` expectation that existing tests pin — a measurement this card
 * did first and ships beside the change.
 *
 * What was left behind: a control-plane customer refused an app, or landed on a
 * surface their runtime does not serve, was dropped on the ENVIRONMENT launcher
 * (ADR-0075) — "Build an app" / "Start from a template" cards acting on an
 * environment the control plane does not have, and "Your apps" tiles that are
 * the control plane's own internal management apps. The declaration was already
 * read by `/` and by the chrome; only the error paths still disagreed.
 *
 * ## ⚠ WHAT THIS FILE CANNOT ASSERT — read before adding a case here
 *
 * A SOURCE SCAN, in the shape of its #7256 sibling. It proves each site stopped
 * naming the launcher and reads the shipped policy; it does not prove where any
 * of them lands. Those are behavioural, one per site, and they are what fails on
 * the pre-#7373 implementation:
 *
 *   - `console/__tests__/AppContent.deniedVsUnpublished.test.tsx` — the denial
 *     screen's way back;
 *   - `console/__tests__/AppContent.inaccessibleAppStrand.test.tsx` — the
 *     no-app-to-enter bounce;
 *   - `console/__tests__/RequireAiSurface.test.tsx` — a runtime serving no
 *     agent;
 *   - `console/ai/__tests__/resolveCollapseToDockTarget.test.ts` — the dock
 *     landing on a cold deep link;
 *   - `views/studio-design/StudioDesignSurface.packageDeletionInference.test.tsx`
 *     — eviction when the edited package is deleted;
 *   - `apps/console/src/components/StudioRoute.test.tsx` — the `/studio` entry
 *     gate and the front door's wordmark.
 *
 * That the hook ANSWERS correctly is `hooks/__tests__/useHomePath.test.tsx`, and
 * that the declaration is read correctly is `utils/__tests__/homePath.test.ts`.
 * None of these replaces another.
 *
 * ## ⛔ Two sites in this file's own subject matter deliberately still name the
 * launcher, and this file must not grow a case for either
 *
 *   - `utils/homePath.ts` — `HOME_LAUNCHER_PATH` IS the launcher, and the `??`
 *     fallback every site above resolves through. Making it anything else is
 *     option C (redirecting `/home` itself), which the card's ruling excluded:
 *     it would strip the environment layer of its real launcher (ADR-0075).
 *   - `console/ConsoleShell.tsx`'s `RootRedirect` — the `/` LANDING, not a
 *     recovery redirect. `/`'s policy layers an emptiness heuristic
 *     (objectui#4048) and refuses to conclude from an unresolved list
 *     (objectui#4233); a third reading without those is a design question,
 *     raised on the card rather than settled inside it.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../../scripts/js-comment-mask.mjs';

/** Local annotation, since the import above is untyped — the call site stays checked. */
const mask: (source: string) => string = maskComments;

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');

const read = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

/**
 * Drop block and line comments before scanning, for the reason the #7256 file
 * gives: doc comments legitimately NAME the launcher while explaining which
 * screen it is and why a site no longer points there, and a rule that forbids
 * documenting its own subject only applies pressure to delete the explanation.
 */
function stripComments(src: string): string {
  return mask(src);
}

/**
 * `RootRedirect`'s body, which lives in the same file as `RequireAiSurface` and
 * keeps the launcher literal on purpose (see the header, and its own case at
 * the bottom of this file). Cut out of the scan so the scan can stay a plain
 * "no literal anywhere" over everything else in that file.
 *
 * If this stops matching — the function renamed or removed — the cut removes
 * nothing and the scan gets STRICTER, never quieter.
 */
const ROOT_REDIRECT_BODY = /export function RootRedirect\(\)[\s\S]*?\n\}/;

/**
 * The recovery exits: file → the expression each must resolve its target by,
 * and the region (if any) the launcher scan deliberately does not read.
 */
const RECOVERY_SITES: ReadonlyArray<{
  file: string;
  site: string;
  expression: RegExp;
  except?: RegExp;
}> = [
  {
    file: 'packages/app-shell/src/console/AppContent.tsx',
    site: 'access-denied screen + the no-app-to-enter bounce',
    expression: /const homePath = useHomePath\(\)/,
  },
  {
    file: 'packages/app-shell/src/console/ConsoleShell.tsx',
    site: 'RequireAiSurface — a runtime that serves no agent',
    expression: /redirectTo \?\? homePath/,
    except: ROOT_REDIRECT_BODY,
  },
  {
    file: 'packages/app-shell/src/console/ai/AiChatPage.tsx',
    site: 'the AI page: no-agent screen + collapse-to-dock landing',
    expression: /const homePath = useHomePath\(\)/,
  },
  {
    file: 'packages/app-shell/src/views/studio-design/StudioDesignSurface.tsx',
    site: 'Studio: deleted-package eviction + header Home',
    expression: /const homePath = useHomePath\(\)/,
  },
  {
    file: 'apps/console/src/components/StudioRoute.tsx',
    site: 'the /studio entry gate + the front door wordmark',
    expression: /const homePath = useHomePath\(\)/,
  },
];

/** `'/home'`, `"/home"` or `` `/home` `` — the literal in any quoting. */
const LAUNCHER_LITERAL = /['"`]\/home['"`]/;

describe('objectui#7373 — recovery redirects follow the declared landing', () => {
  it.each(RECOVERY_SITES)('$site does not hard-code the launcher path', ({ file, except }) => {
    const src = stripComments(read(file));
    expect(except ? src.replace(except, '') : src).not.toMatch(LAUNCHER_LITERAL);
  });

  it.each(RECOVERY_SITES)('$site resolves its target through the policy', ({ file, expression }) => {
    expect(stripComments(read(file))).toMatch(expression);
  });

  it('the scan can still fail — the literal is what it is looking for', () => {
    // Without this, a `maskComments` that started returning '' would pass every
    // case above as a scan of nothing. Same source, same masker, same regex.
    expect(stripComments(`const x = '/home';`)).toMatch(LAUNCHER_LITERAL);
    expect(stripComments(read('packages/app-shell/src/utils/homePath.ts'))).toMatch(
      LAUNCHER_LITERAL,
    );
  });

  it('⛔ the launcher constant itself is untouched — option C stays excluded', () => {
    // `HOME_LAUNCHER_PATH` is the fallback every site above resolves through.
    // A card that "fixed" this line would redirect `/home` itself and strip the
    // environment layer of its launcher (ADR-0075) — excluded by the ruling.
    const src = stripComments(read('packages/app-shell/src/utils/homePath.ts'));
    expect(src).toMatch(/export const HOME_LAUNCHER_PATH = '\/home';/);
  });

  it('⛔ the `/` landing keeps its own resolver', () => {
    // `RootRedirect` is `/`'s redirect, not a recovery exit, and it may not be
    // quietly folded into the hook: `/`'s answer is `resolveLandingPath`, whose
    // extra rules this one does not have. Pinned by the comment that SAYS so,
    // so deleting the reasoning is a visible act rather than a silent one.
    const src = read('packages/app-shell/src/console/ConsoleShell.tsx');
    expect(src).toMatch(/Deliberately NOT retargeted onto `useHomePath\(\)`/);
    // …and it is still the launcher it sends `/` to. This is the region the
    // scan above cuts out, so without this case that cut would be unwatched.
    const body = stripComments(src).match(ROOT_REDIRECT_BODY)?.[0];
    expect(body, 'RootRedirect no longer matches — the scan cut nothing').toBeTruthy();
    expect(body).toMatch(LAUNCHER_LITERAL);
  });
});
