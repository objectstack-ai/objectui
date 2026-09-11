#!/usr/bin/env node
/**
 * The console performance budget, weighed over the EAGER CLOSURE.
 *
 * ## What this replaces
 *
 * `.github/workflows/performance-budget.yml` is named "Bundle Analysis" and its
 * step is "Check console performance budget", but until objectui#5324 it gzipped
 * exactly one file:
 *
 *     ENTRY_FILE=$(find "$DIST_DIR" -name 'index-*.js' ... | head -1)
 *     GZIP_BYTES=$(gzip -c "$ENTRY_FILE" | wc -c)
 *
 * The entry chunk is not what a page load costs. It statically imports a closure
 * of other chunks, and the browser fetches and parses all of them before the app
 * renders. Measured on `77f846a8b`:
 *
 *   | index-*.js alone (what the budget weighed) |    25,910 bytes gzipped |
 *   | the eager closure — 58 of 507 chunks       | 3,881,609 bytes gzipped |
 *
 * So the gate passed on 0.67% of the payload it claimed to govern. That is not
 * theoretical: objectui#5266 put 89 KiB gzipped on every console page load, it
 * landed in `vendor-objectstack-*.js`, and this gate could not see it.
 * `advancedChunks` deliberately routes vendor and workspace code into named
 * chunks, so MOST regressions land outside `index-*.js`.
 *
 * That table is the MOTIVATING measurement and stays pinned to `77f846a8b`; it
 * is not the current reading. {@link BASELINE} carries today's, and the ceiling
 * section below does the arithmetic against it.
 *
 * ⛔ That rule is general, and since objectui#7528 it is a gate rather than an
 * intention: a chunk count written in this file's prose — or in
 * `scripts/__tests__/check-eager-closure-budget.test.ts`'s — stays pinned to the
 * commit it was measured on, as the table above is, or it is not written at all.
 * An UNANCHORED count is a standing claim about the LIVE closure, and the live
 * closure's count moves on most builds. Three sentences here made exactly that
 * claim ("one number over N chunks"), and by the time objectui#7528 read them
 * back the prose, {@link BASELINE}'s frozen `chunks` and the gate's own output
 * were three DIFFERENT numbers — with nothing red anywhere across that spread,
 * because nothing fails on a stale number in a comment. Refreshing the literal
 * would only restart that clock; naming the population has no clock to restart.
 * Two durable readings, neither of them a copy:
 *
 *   * HOW MANY — `pnpm check:eager-closure` prints it, in the gate's own verdict
 *     line: "Console eager closure is N KB gzipped across E of T chunks
 *     (budget: ... KB, headroom: ... KB)".
 *   * WHICH — `apps/console/dist/eager-closure.json`, written by
 *     `emitEagerClosureReport` in `apps/console/vite.config.ts` on every build.
 *
 * {@link BASELINE} is not an exception to it. That constant NAMES the commit it
 * was measured on, which is the anchored form the rule asks for: a frozen
 * measurement that says which build it came from cannot go stale, it can only
 * become old, and re-baselining is what that has instead of a rewrite.
 *
 * ## Where the number comes from
 *
 * `apps/console/vite.config.ts` (`emitEagerClosureReport`) writes
 * `apps/console/dist/eager-closure.json` from rolldown's own `chunk.imports` —
 * a BFS from the entry chunks over STATIC imports only, gzipping the bytes that
 * were actually written to disk. This file only applies a ceiling to it. The
 * split keeps graph knowledge where the graph is and policy where it can be unit
 * tested (`scripts/__tests__/check-eager-closure-budget.test.ts`), and it keeps a
 * size regression from failing every Vercel preview and local build — which is
 * how a budget gets switched off rather than fixed.
 *
 * ## The ceiling, and why it is this number
 *
 * `MAX_EAGER_CLOSURE_GZIP_BYTES` is today's measurement plus headroom of half
 * {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES}. Two constraints pin it from
 * both sides, and since objectui#5924 BOTH are checked against the report this
 * gate just read, not against a literal frozen next to them:
 *
 *   - It must PASS on today's `main`. A gate that lands red is a gate someone
 *     disables, and this one replaced a gate nobody could fail. ⛔ No figure is
 *     restated here: this bullet carried one and it went a whole re-baseline
 *     stale (objectui#7518). The headroom the CONSTANTS carry is stated once,
 *     on {@link MAX_EAGER_CLOSURE_GZIP_BYTES}; what the LIVE closure has left
 *     is what `pnpm check:eager-closure` prints, and it is the smaller of the
 *     two once the payload has drifted up from the baseline.
 *   - The headroom must stay SMALLER than the regression the gate exists to
 *     catch. objectui#5266 was 89 KiB = 91,136 bytes, and this ceiling is built
 *     to carry half of that, so it would have failed on that change. Widening
 *     the headroom past ~89 KiB would leave the gate green through a repeat of
 *     its own motivating incident.
 *
 * Half the regression size, rather than the ~2% this line used to carry, is a
 * deliberate choice that only became necessary once the second constraint
 * started being enforced live (next section). Headroom H buys H bytes of growth
 * before the gate reds for being over budget, and costs REGRESSION - H bytes of
 * SHRINK before it reds for going blind. H = REGRESSION / 2 is the only value
 * equidistant from the two, and it is the value that maximises the smaller of
 * the two distances: ~45 KB of room in each direction rather than 66 KB one way
 * and 25 KB the other.
 *
 * ## Why the headroom is checked LIVE (objectui#5924)
 *
 * The second constraint above used to be asserted only in the unit test, as
 *
 *     MAX_EAGER_CLOSURE_GZIP_BYTES - BASELINE.gzipBytes < REGRESSION_...
 *
 * Both operands are frozen literals from this module, so that assertion was
 * true regardless of what the console actually weighed, and it stayed true
 * while the closure got ~706 KB SMALLER than the pinned baseline. The invariant
 * was STATED about the live bundle and CHECKED about two constants; it would
 * have stayed green if the closure halved again.
 *
 * What that cost, demonstrated rather than inferred (objectui#5924): with the
 * ceiling at 4,086,000 over a live 3.3 MB payload, an eager
 * `@objectstack/spec/cloud` namespace import into `apps/console/src/main.tsx`
 * added 158,006 gzipped bytes to the closure — 1.7x the incident this gate was
 * built to catch — and the aggregate half printed a green tick with "headroom:
 * 613.4 KB" underneath it.
 *
 * {@link evaluateHeadroomSensitivity} now derives that headroom from the report,
 * for the aggregate ceiling AND for every per-chunk ceiling — four ceilings as
 * of objectui#5490 — and calls a ceiling that sits more than one regression
 * above its own measurement an ERROR (exit 2). That verdict is about the GAUGE,
 * not the bundle, which is why it is an error and not a size failure: a green
 * tick that cannot distinguish "no regression" from "the motivating incident,
 * twice over" carries no information. It is the same shape as a budget keyed on
 * a chunk that is not there, and the same rule applies — measuring nothing must
 * be LOUDER than measuring something over the line, never quieter.
 *
 * The consequence is deliberate: drift in the SHRINKING direction is no longer
 * free. A PR that takes more than ~45 KB out of the closure now has to re-pin
 * the ceiling it just made decorative, in the same commit, instead of leaving a
 * decision that silently comes due and is never taken. The constant-vs-constant
 * assertions stay in the unit test as a secondary guard: they still catch an
 * edit that raises a ceiling past the regression size without any build.
 *
 * ## Why this number has moved (objectui#5328 up, objectui#5924 down)
 *
 * It was 3,960,000 over a 3,881,609 baseline measured on `77f846a8b`. Pinning
 * `@objectstack/spec` and its three siblings to 17.1.0 put the closure 41,689
 * bytes over that ceiling: the release is ~930 KB larger uncompressed, and
 * essentially all of it lands in `vendor-objectstack-*.js`. That is REAL added
 * payload, not a measurement artefact, and it is larger than the #5266
 * regression this gate was sized to catch — the gate did its job.
 *
 * The re-baseline was therefore escalated rather than taken by the seat doing
 * the bump, because #5468 had ruled days earlier that the aggregate ceiling
 * "stays as shipped" and that gate-strength policy is the maintainer's. The
 * maintainer ruled option A on #5531: raise it, permanently, together with the
 * headroom assertion that guards it. Both constants move in ONE commit — raising
 * the ceiling alone leaves headroom at ~200 KB and fails the test below, which
 * is the guard working, not an obstacle to route around.
 *
 * objectui#5924 then lowered it to 3,345,000 over 3,299,898 bytes measured on
 * `48e53814e`: 706,013 bytes BELOW the `4c1623c0c` baseline the previous ceiling
 * was derived from. Nothing was cleaved to earn that — the closure shrank on its
 * own while the ceiling stayed put, which is exactly the drift that opened the
 * blind band above. Lowering a ceiling TOWARD reality is a tightening, not a
 * weakening: no build that passed before the change and measures under 3,345,000
 * fails after it, and the gate's sensitivity is once again larger than the
 * headroom it guards. This was taken as a card's stated decision (objectui#5924,
 * triage disposition 3) rather than silently, which is what the "Raising it"
 * note below asks of a re-baseline in either direction.
 *
 * objectui#6683 lowered it again, to 3,300,000 over 3,254,004 — and this one was
 * EARNED rather than drifted into. `@object-ui/app-shell` now publishes a
 * precise `sideEffects` array (guarded by
 * `scripts/check-side-effects-array.mjs`), which made 56,668 gzipped bytes of
 * the barrel's closure shakeable. That is LARGER than the 45,102 bytes of
 * headroom the 3,345,000 ceiling carried, so the ceiling had to move with it or
 * the aggregate gauge would sit at 1.00x its own sensitivity — the blind band
 * reopening the same day it was measured shut. The two numbers move in ONE
 * commit for the reason the paragraph above gives.
 *
 * objectui#6776 lowered it a third time, to 3,268,000 over 3,222,314, and this
 * one was earned the same way. `views/metadata-admin/index.ts` stopped being a
 * registering module — its five load-time registrations moved to a leaf the
 * PACKAGE ENTRY bare-imports — so the `sideEffects` array stopped naming it, the
 * package barrel's 25 runtime re-exports were re-pointed at leaf modules, and
 * the whole `metadata-admin` chunk (172,945 gzipped bytes, 144 modules) left the
 * eager closure: 3,254,230 -> 3,222,314, −31,916 bytes, measured on two full
 * console builds. The maintainer ruling of 2026-08-30 made the re-baseline part
 * of the change rather than a follow-up, in its own words:
 *
 *     ⛔ ceiling 处置写死(不作实施者临场判断):-31KB 把余量推到 ~0.89x 门禁
 *     89KB 回归阈值(近盲),同批重设 `MAX_EAGER_CLOSURE_GZIP_BYTES`;抬 ceiling
 *     是有申报程序的 ratchet,裁决原话引入 PR 正文。
 *
 * Measured, the drift was 0.85x rather than 0.89x — the gate printed
 * `headroom 75.9 KB = 0.85x the 89.0 KB regression` on the post-change build
 * before this constant moved. Either way it is the blind band reopening, and the
 * direction of this edit is DOWN: no build that passed before it and measures
 * under 3,268,000 fails after it.
 *
 * ⚠️ Read the direction correctly: the closure did NOT fall by the 242.6 KB the
 * objectui#6683 card projected. That figure was measured for
 * `"sideEffects": false`, which is closed by measurement because it also DROPS
 * three live SDUI widget registrations. The precise array keeps them, and
 * keeping them keeps their import closure eager; 56,668 bytes is what the
 * correct declaration actually buys. The gap is not a defect in the array — it
 * is the price of the correctness the ruling required, and the difference is
 * recorded here rather than smoothed over.
 *
 * ⛔ The floor is unchanged and applies to a LOWERING too: never put a ceiling
 * below a measured figure to express an aspiration. That is not a tighter
 * ratchet, it is a gate that lands red on `main`, which is how a budget gets
 * switched off rather than met.
 *
 * What did NOT move: {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES}. That is the
 * gate's sensitivity, the ruling did not touch it, and re-baselining must never
 * become an excuse to widen it — a ceiling that rises while the sensitivity
 * relaxes is a gate quietly retiring itself.
 *
 * This is a truthful CURRENT-STATE ceiling, not a target. A multi-megabyte
 * gzipped payload before first render is a bad payload, and the honest
 * long-term line is far below it — but lowering the line to a TARGET is a
 * separate decision with its own work behind it (objectui#5324 names the
 * candidates), and re-baselining onto a fresh measurement is not that. Nothing
 * here should be read as a finding that the ceiling standing over the closure
 * today is acceptable.
 *
 * Which is which: {@link BASELINE} carries the measured payload and
 * {@link MAX_EAGER_CLOSURE_GZIP_BYTES} is the ceiling standing over it. Saying
 * which is which is the whole of this note — a paragraph that names two sizes
 * without naming their subjects reads as one number that changed its mind
 * (objectui#7528).
 *
 * ⛔ Neither paragraph renders either constant as a size, deliberately. This
 * note used to state both of them as MiB literals; a re-baseline moved both
 * constants, and four days and three later edits to this file went by with the
 * RETIRED pair still written here and nothing red anywhere across that
 * distance, because nothing fails on a number written in a comment
 * (objectui#8964). The subjects are named and the readings are left to the
 * instrument: the two constants below carry them in bytes, each pinned to the
 * commit it was measured on, and the gate's verdict line prints the live one on
 * every run. `scripts/__tests__/check-eager-closure-budget.test.ts` refuses a
 * rendered size written back into either paragraph.
 *
 * ## Per-chunk ceilings (objectui#5490)
 *
 * One total over the whole eager closure cannot say WHERE the payload moved, and
 * inside its headroom one chunk can grow by the whole allowance while the others
 * shrink.
 * {@link PER_CHUNK_GZIP_CEILINGS} adds a line per big chunk on top of the
 * aggregate — same truthful-current-state discipline, same checked constraints,
 * keyed on the chunk names the REPORT carries so a renamed or vanished chunk
 * fails loudly instead of passing by weighing nothing. See that constant's
 * comment for the reasoning and for how to move one.
 *
 * ## Is the ceiling still the one in force? (objectui#6245)
 *
 * The three halves above all read this file's constants and take them as given.
 * None of them can ask whether the constants THEMSELVES are current, and on a
 * `pull_request` run that question has a wrong answer that is invisible from
 * inside the checkout: `Bundle Analysis` is a required context, GitHub does not
 * re-run a PR's checks when the base branch moves, so a green verdict can be
 * computed against ceilings `main` has since replaced — and the merge is gated
 * on it. Measured, not inferred: run 32804357171 started 6m50s AFTER
 * `0409b766d` lowered the aggregate ceiling to 3,345,000 and published
 * `BUDGET_CLOSURE_BUDGET_KB: 3990.2` — the retired 4,086,000 — as a success.
 *
 * {@link evaluateCeilingFreshness} is the fourth half and closes that window
 * inside the tool: it compares {@link VERDICT_CEILING_CONSTANTS} across three
 * readings of this file — this checkout, the base commit the checkout was made
 * from, and the base branch tip — and calls a ceiling the base branch moved out
 * from under this run an ERROR (exit 2). Three readings rather than two because
 * a re-baseline PR differs from the base branch deliberately and must still
 * land; see that function for the rule and for the residual window it cannot
 * close.
 *
 * ## Raising it
 *
 * Re-baselining is legitimate — it is how a ratchet advances — but it is a
 * DECISION, so make it visible: update the constant, update the measured figure
 * in the prose attached to it, and say in the PR what the added bytes buy.
 * Silently bumping the number to make CI green reproduces the gate this file
 * replaced.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntrypoint } from './invoked-as.mjs';

/**
 * Ceiling for the console eager closure, in gzipped bytes. See the header for
 * how this number was chosen; {@link BASELINE} names the measurement and the
 * commit it was taken on.
 *
 * Re-baselined DOWNWARD four times, each time toward a measurement the payload
 * had already fallen to:
 *
 *   - objectui#5924, from 4,086,000 (derived from the 4,005,911 reading on
 *     `4c1623c0c`) to 3,345,000 over 3,299,898 on `48e53814e`.
 *   - objectui#6683, to 3,300,000 over 3,254,004. `@object-ui/app-shell` now
 *     declares a precise `sideEffects` ARRAY, which took 56,668 gzipped bytes
 *     out of the closure — more than the 45,102 of headroom the previous
 *     ceiling had, so leaving it in place would have parked the aggregate gauge
 *     at 1.00x its own sensitivity and, on the next byte of shrink, tripped the
 *     exit-2 verdict about the gauge. Lowering it in the SAME change is the
 *     tightening the maintainer ruling of 2026-08-29 asked for.
 *   - objectui#6776, to 3,268,000 over 3,222,314. The metadata-admin engine's
 *     five load-time registrations moved out of the page barrel, so the barrel
 *     stopped being named by the `sideEffects` array and the 172,945-byte
 *     `metadata-admin` chunk left the eager closure (−31,916 bytes). The
 *     3,300,000 ceiling was measured carrying 75.9 KB of headroom afterwards —
 *     0.85x the regression this gate must catch, the blind band reopening — and
 *     the 2026-08-30 ruling made moving it part of the same change.
 *   - objectui#7479, from 3,597,000 to 3,210,000 over 3,164,817. Nine of the
 *     ten locale catalogues left the eager closure for `import()`ed chunks of
 *     their own: −410,553 gzipped bytes, 4.5x the regression this gate must
 *     catch, so the old ceiling would have stood 432,183 bytes (4.74x) above
 *     the payload and {@link evaluateHeadroomSensitivity} would have called the
 *     gauge blind — an exit 2 about the instrument, in the same run that earned
 *     the shrink. See "Why `i18n-locales` became `i18n-locale-en`" in the
 *     header for both builds and the three control rows that show the bytes
 *     LEFT rather than moved.
 *
 * Headroom above {@link BASELINE} is 45,183 bytes — 0.50x
 * {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES}. ⚠️ That is arithmetic on two
 * constants in this file, so it stays true while they do — it is NOT what the
 * closure has left today, which is smaller by every byte the payload has
 * drifted up since the baseline below was taken. `pnpm check:eager-closure`
 * prints the figure in force, and that is the one governing your build.
 *
 * ## ⚠️ RAISED ONCE, ON EXPLICIT MAINTAINER AUTHORISATION (objectui#7122)
 *
 * Raising this ceiling is a gate weakening and sits on the manual floor, so it
 * is a human's act, not an agent's. The authorisation, verbatim:
 *
 *     维护者 sam@objectstack.ai 于本轮明确授权：「抬上限，把 7685 弄绿」
 *
 * recorded on objectui#7122 as decision batch 1 item 1 = "B + A" (a one-time,
 * cause-recorded adjustment of exactly the measured delta, with the upstream
 * card filed alongside).
 *
 * ⛔ WHAT THE BYTES BUY, stated plainly because this is NOT routine growth and
 * must not read as one. The residue is `@objectstack/spec` 17.3.0's own
 * browser-dist growth: +292.2 KB gzip on the spec package alone, whose measured
 * mechanism is that 17.3.0 LENGTHENED the Zod `.describe()` doc strings that
 * ship in the browser build ("Output schema" became "Output schema (JSON
 * Schema)", and so on across the schema surface). It is authoring documentation
 * prose, shipped to every page load.
 *
 * ⛔ It is NOT duplication — that was a separate, larger problem and it is
 * already fixed. Resolving the spec alone to 17.3.0 shipped TWO copies of it
 * (four sibling packages pin it exactly), which this branch collapsed by moving
 * the family together in the lockfile: −671 KB, and the probe for markers
 * unique to 17.2.0 fell from 92.3% to 1.0% of 104, with the single survivor
 * accounted for. No chunk entered or left the closure; the eager chunk count is
 * unchanged.
 *
 * ⇒ ⭐ THE UPSTREAM FIX WAS REFUSED, so these numbers are the STANDING
 * BASELINE and not an exception awaiting reversal. Stripping the `describe()`
 * prose out of the browser build would return ~292 KB to EVERY consumer of the
 * spec, not just this console; that was filed as objectstack#16063, and it was
 * ruled against. Maintainer verbatim 「16063 c」 — director-seat decision batch
 * #59, recorded on objectui#7122 on 2026-09-06: the growth is accepted
 * upstream, and neither a prose-stripped build nor a short-`describe`
 * convention will land.
 *
 * ⛔ The objectstack#16063 citation therefore STAYS, and its sense is the one
 * thing about it that changed — it is now the RECORDED CAUSE this ceiling
 * rests on, where it used to be a condition to wait out. ⛔ Nothing is coming
 * that would bring this ceiling and {@link BASELINE} back down together, so do
 * not reinstate anything on its account and do not write a fresh condition in
 * its place: a re-baseline that reads as temporary is one nobody ever
 * re-measures. The next bump is measured against THIS number, knowing why it
 * moved — the authorisation above (objectui#7122, decision batch 1 item 1 =
 * "B + A") and the figures it bought landed together in objectui#7685,
 * `639114c4d`.
 *
 * ⛔ No other exemption was added, no import was made lazy, and no other
 * ceiling was moved — the three per-chunk lines that still pass were left
 * exactly as they are.
 */
export const MAX_EAGER_CLOSURE_GZIP_BYTES = 3_210_000;

/**
 * The measurement the ceiling above was derived from. Exported so the two
 * constraints in the header are CHECKED rather than merely argued
 * (`scripts/__tests__/check-eager-closure-budget.test.ts`): a future edit that
 * raises the ceiling past the regression size it is meant to catch fails a
 * test instead of quietly becoming decorative.
 */
export const BASELINE = Object.freeze({
  /**
   * `emitEagerClosureReport`'s `eagerGzipBytes` on this commit.
   *
   * ⚠️ `755d34a5f` is NOT "this branch's last commit before the one that edits
   * this file" — the argument every earlier entry here made. objectui#7479's
   * change IS a console build input (`packages/i18n/src/**` and
   * `apps/console/vite.config.ts`), so the commit named below is the one that
   * CARRIES it and the reading is of that tree. The
   * `scripts/vite-*.ts`-versus-`scripts/check-*.mjs` half of the argument
   * the previous baseline made (`34a1578ef`, and `3d257c85a` / `bd2a7ec50`
   * before it) still holds, and is why the two can share one branch: nothing in
   * this file or its unit test reaches the bundler, so the ceiling edit cannot
   * have moved the figure it pins.
   *
   * The reading it is SUBTRACTED from is the control build of `origin/main`
   * `d8b4739d4` in the same container with the same instrument — 3,575,370
   * bytes across 50 of 518 chunks. Both builds are recorded under "Why
   * `i18n-locales` became `i18n-locale-en`" in the header, with the three
   * unmoved chunks that make the delta readable as bytes LEAVING rather than
   * bytes moving.
   *
   * Measured by `pnpm --filter @object-ui/console build` (exit 0) reading
   * `apps/console/dist/eager-closure.json`. ⛔ Not taken from CI's report and
   * not extrapolated: CI weighs the pull-request MERGE ref and this is the
   * branch tree, so the two differ by whatever has landed on `main` since.
   */
  gzipBytes: 3_164_817,
  chunks: 51,
  totalChunks: 528,
  commit: '755d34a5f',
});

/**
 * 89 KiB gzipped — the per-page-load cost objectui#5266 added, landing in
 * `vendor-objectstack-*.js` where the entry-chunk budget could not see it. The
 * headroom above {@link BASELINE} must stay under this, or the gate is green
 * through a repeat of the incident that motivated it.
 */
export const REGRESSION_THIS_GATE_MUST_CATCH_BYTES = 89 * 1024;

/**
 * Per-chunk ceilings, in gzipped bytes, keyed by the chunk NAME the report
 * carries (objectui#5490, the ruled follow-up of objectui#5468: option A now,
 * option C next, option B — a comparison against `main` — rejected).
 *
 * ## Why the aggregate ceiling is not enough
 *
 * The aggregate is one number over every chunk in the closure. Inside its
 * headroom, a single chunk can grow by the whole allowance while every other
 * chunk shrinks by the
 * same amount, and the gate reports a green tick either way. That is not a
 * hypothetical shape: objectui#5266 put 89 KiB on every page load and ALL of it
 * landed in `vendor-objectstack`, the chunk that is 29% of the closure today.
 * The aggregate says whether the payload grew; these say WHERE.
 *
 * ## Why the keys are names from the report and not names written here
 *
 * The names are decided by `advancedChunks.groups` in
 * `apps/console/vite.config.ts`, emitted by rolldown, and published in
 * `files[].name`. This file looks them up; it does not re-derive them by
 * stripping `-<hash>.js` off a file name, and it does not carry a list of
 * chunks it EXPECTS to exist independent of the measurement.
 *
 * The distinction is the whole design, because the failure mode is silent. A
 * budget keyed on a chunk name that no longer exists is VACUOUSLY GREEN: it
 * passes because there is nothing to weigh. So a budgeted name that is absent
 * from the report is an ERROR here (exit 2, "the gauge cannot be trusted"),
 * never a skip — the same asymmetry {@link validateReport} exists for. If a
 * group is renamed or removed in `vite.config.ts`, this gate stops the build
 * and says so, and the mapping is re-pinned deliberately.
 *
 * ## Why `framework` moved (objectui#6759)
 *
 * From 502,000 over a 492,399 reading on `2c8474c04` to 512,000 over 502,405
 * on `a64e96ca8`. What the added bytes buy is user-facing diagnostic text, in
 * ten locales, for two ordinary author mistakes that used to be unreported:
 *
 *   - a malformed or absent gantt date crashed the render outright
 *     (`RangeError: Invalid time value`), and
 *   - an inverted author-pinned range drew a bar at `width: -4.3%` under a
 *     header row with zero cells, and said nothing at all.
 *
 * A hard crash and a confidently-wrong render, both reachable from a typo in
 * authored metadata, replaced by a refusal that names the offending value.
 *
 * The CODE that fix added buys none of this chunk, which is why there was
 * nothing to trim instead: `plugin-timeline` is lazy and is not in the eager
 * closure at all, so the guard, the value speller and both refusal branches
 * cost this budget zero. Every byte of the growth is `packages/i18n` locale
 * data, which lands here. Measured on the built chunk by deleting the twenty
 * strings and re-gzipping: the ten locales' message text is 1,999 of the
 * ~2,283 bytes the chunk grew by, and PER MESSAGE it costs 1,000 bytes
 * against the 1,002 that objectui#6655's single refusal — the neighbour whose
 * shape this one copied — already costs in the same chunk. The only lever
 * left was to say less, in ten languages, about what the author got wrong.
 *
 * ⚠️ Most of the headroom this consumed was not spent by that card. The
 * previous ceiling carried 9,601 bytes and `main` had already drifted to
 * 488.4 KB of the 490.2 KB it allowed — 1.8 KB left, 0.02x the regression
 * this gate must catch — before objectui#6759 added a byte (`b98352a15`,
 * this PR's base, the gate's own printed line). Re-pinning the baseline onto
 * a fresh measurement is what puts the gauge back in range. The drift itself,
 * and that nobody could say which side moved it, is objectui#6631; this card
 * does not close it and deliberately leaves the other two entries alone.
 *
 * ## Why `framework` moved again — objectui#7173, +4,671 bytes
 *
 * `AiPendingActionsInbox` (the AI HITL approval inbox) was the fifth untranslated
 * copy of the relative-time helper in this repo AND had no translation wiring at
 * all, so it was swept whole: every string it shows now resolves from the locale
 * packs. Thirty-eight new keys, translated in all ten languages — an `aiApprovals`
 * namespace in `packages/i18n`. That is what the bytes buy: the AI approvals inbox
 * reads in the session's language instead of English, headings, tabs, status
 * badges, empty state, drawer labels, reject dialog and all.
 *
 * The COMPONENT costs this budget nothing: `plugin-chatbot` is lazy and is not in
 * the eager closure. Every byte is `packages/i18n` locale data, which lands in
 * this chunk — the same mechanism as objectui#6759's twenty strings above.
 *
 * ATTRIBUTED, not assumed. Three console builds, the two extremes byte-identical
 * in the two chunks that did not move:
 *
 *   | build                                              | `framework` gzip |
 *   | merge parent `c93b4d5f3`                           |          510,192 |
 *   | this branch with the ten `aiApprovals` blocks cut  |          510,192 |
 *   | this branch                                        |          514,863 |
 *
 * The ablated build reproduces the merge parent's figure exactly, so the whole
 * 4,671-byte delta is the pack blocks and nothing else — not the new
 * `useAiApprovalsTranslation.ts` module, not the converted component.
 * `vendor-objectstack` is 947,931 on both; `ui-components` moves one byte.
 *
 * Most of the overage was drift, again: the merge parent already stood at 510,192
 * of the 512,000 the previous ceiling allowed — 1,808 bytes left, 0.02x the
 * regression this gate must catch — so a 4.6 KB addition put it 2,863 bytes over.
 * The new pair re-pins the gauge onto a fresh measurement and KEEPS the line's own
 * headroom convention rather than widening it: 9,137 bytes (0.10x), against the
 * 9,595 (0.11x) the retired pair carried. objectui#6631 still owns the drift.
 *
 * ## Why `framework` moved DOWN, and where its bytes went — objectui#7399
 *
 * From 524,000 over 514,863 to 71,000 over 61,465, and a fourth line appears:
 * `i18n-locales`, 455,000 over 446,076. Neither number is a payload change. The
 * console downloads the same eager closure before and after; it is written to
 * two more files.
 *
 * What this ceiling was actually weighing, measured on `e307c9896` from the
 * emitted chunk's own module list — the `framework` chunk held 166 modules and
 * only 145 of them came from `core|react|types`, its own test:
 *
 *   | packages/i18n             |  16 mod | 78.7% of the chunk's bytes |
 *   | packages/core             |  67 mod |  9.6% |
 *   | packages/react            |  63 mod |  4.7% |
 *   | packages/data-objectstack |   5 mod |  4.6% |
 *   | packages/types            |  15 mod |  2.3% |
 *
 * Five workspace groups in `apps/console/vite.config.ts` sat at `priority: 80`
 * with `framework` written first, and on that tie the subgraph reached through
 * `@object-ui/react` was absorbed by the group listed first — a group whose
 * regex matches NEITHER intruder. So this line was, in operation, a budget on
 * the TEN LOCALE CATALOGUES: 523,959 measured against 524,000, forty-one bytes
 * of headroom for the whole repository, while `data-adapter` — declared since
 * objectui#5490 — emitted no chunk at all.
 *
 * ⛔ The expensive half is not the arithmetic. A gate whose message says "you
 * grew `core|react|types`" when the cause is a translation key teaches a FALSE
 * RULE, and it was followed: two changes were publicly blamed for bytes they do
 * not ship (objectui#7399's own retraction). Naming the chunk for what it holds
 * is what makes the constraint legible where it is authored.
 *
 * Lifting the two swallowed groups one tier above the tie (priority 84) gives
 * each ceiling a subject its name states. Measured across the change:
 *
 *   | chunk           | before  | after   |
 *   | `framework`     | 523,959 |  61,465 |  166 modules -> 140, all core/react/types
 *   | `i18n-locales`  |       — | 446,076 |  22 modules, 100% packages/i18n
 *   | `data-adapter`  |       — |  17,846 |  10 modules, 91.8% data-objectstack
 *   | aggregate       |3,255,233|3,256,012|  +779 B, +0.024%
 *
 * The +779 is the cost of two more chunk boundaries — `import` statements in
 * the chunks that now name two files where they named one — and it is stated
 * here because it is the ONE thing this change spends. ⛔ It is not headroom to
 * borrow against, and {@link MAX_EAGER_CLOSURE_GZIP_BYTES} was deliberately NOT
 * touched: the maintainer ruling of 2026-09-03 authorised a re-attribution and
 * the per-chunk re-baseline it forces, and nothing else. Its own words:
 *
 *     ⛔ The aggregate ceiling is not touched. A′ is a pure re-attribution —
 *     the browser downloads exactly the same bytes.
 *
 * ⚠️ Both new pairs are why the re-baseline is not optional. Left at 524,000
 * over a 61,465 payload, `framework` sits 5.08x above its own measurement and
 * {@link evaluateHeadroomSensitivity} returns exit 2 — the blind-gauge verdict,
 * correctly. The new pairs keep this line's own headroom convention rather than
 * widening it: 9,535 bytes (0.10x) for `framework`, 8,924 (0.10x) for
 * `i18n-locales`, against the 9,137 (0.10x) the retired `framework` pair
 * carried.
 *
 * `data-adapter` gets no ceiling. 17,846 bytes is smaller than a dozen
 * unbudgeted eager chunks, and this constant is a line per BIG chunk, not a
 * line per named group; inventing one for it would be a number with no
 * incident behind it.
 *
 * ⭐ RETIRED by objectui#8816's raise — see "Why `i18n-locales` moved UP" below.
 * The pair this paragraph sized (455,000 over 446,076, 8,924 bytes of headroom)
 * is gone, and so is the unit it offered: "about sixty translation keys at ~147
 * gzipped bytes a short key" is an average across a spread now measured at 2.4x,
 * two real claimants costing 9.2 and 22.3 bytes per key-times-locale. ⛔ Its
 * forecast was wrong in the direction that matters too — the headroom was gone
 * in seven days and the AGGREGATE never became the binding line; it is still
 * carrying 0.26x with both claimants on it. What survives is the last sentence,
 * which is why it is kept verbatim: that the aggregate is the correct place for
 * the constraint to live is the argument for taking the catalogues out of the
 * eager closure rather than for raising anything.
 *
 * ## Why `framework` moved UP — the maintainer ruling of 2026-09-08
 *
 * From 71,000 over a 61,465 payload to 100,000 over 72,245, the latter measured
 * on `3f775eeb8`. ⛔ The number is the MAINTAINER'S, taken after the trade-off
 * was put to them; it is not derived here, and nothing in this section should be
 * read as a derivation of it. What is recorded here is what the raise COSTS,
 * because that is the half a later reader cannot recover from the constant.
 *
 * ⛔ What the bytes buy — MEASURED, but AFTER this constant moved. When the raise
 * landed nobody could answer the question its own failure message asks — "say in
 * the PR what the bytes buy" — because the window had not been bisected, and this
 * section recorded that as the finding. objectui#8542 has since run it: one
 * `apps/console` build per point, each from the repo ROOT, `framework` read out
 * of the `apps/console/dist/eager-closure.json` the build itself writes.
 *
 *   | build       | landed by | `framework` gzip | moved by                 |
 *   | `40a7c538a` | #8503     | 70,999           | last GREEN, 1 byte under |
 *   | `512c84b16` | #8519     | 70,999           |                        0 |
 *   | `f76f43628` | #8512     | 71,261           |                     +262 |
 *   | `e76634cc8` | #8529     | 72,245           |                     +984 |
 *   | `e411c3e58` | #8562     | 72,248           |                       +3 |
 *
 * ⚠️ TWO commits own the overage and the LARGER one is OUTSIDE the window this
 * section bounded. `e76634cc8` landed after the red had already started and
 * carries 984 of the 1,246 bytes the pair added — 79% — against 262 for the
 * commit the red first appeared on. ⛔ A repair scoped to the window would have
 * left `main` red. `512c84b16` emitted a byte-identical chunk to `40a7c538a`
 * (the same `framework-nDOJv2Ij.js` content hash), so the three commits between
 * them moved this chunk by ZERO — and objectui#8541's named suspect
 * `270f2825b` is measurably innocent: it touches no file under
 * `packages/(core|react|types)` at all.
 *
 * ⇒ So the bytes are identifiable, and they are two silent-wrong-answer fixes on
 * ONE file's filter path, `packages/core`'s `ValueDataSource`. `f76f43628`
 * (#8512): an unrecognised `$` operator ended the switch on `default: break`,
 * adding no constraint, so it matched EVERY row. `e76634cc8` (#8529): an array
 * comparand and a `{ $field }` reference were compared by REFERENCE, selecting
 * every row under `$ne` and no rows under `$eq`, neither of them saying so. The
 * bytes ARE the refusals and the prescriptions that replaced that silence.
 *
 * ⛔ None of which retires the cost above: the line that was holding these bytes
 * in view now passes over them, and the attribution arrived after the constant
 * moved rather than before it. ⚠️ Nor is trimming the alternative it looks like
 * — deleting every refusal message string these two commits ship was measured at
 * 610 gzip bytes against the 1,245 the overage needed (recorded on
 * objectui#8542, ⛔ not re-measured here), so the whole diagnostic surface is
 * worth under half the payload it gets blamed for. ⭐ Why `main` was one byte from
 * this line in the first place is objectui#8554: it sat at 70,999 against 71,000
 * — headroom 0.00x — and printed a GREEN sensitivity row while it did, because
 * {@link evaluateHeadroomSensitivity} had no floor at the time. It has one now,
 * {@link EXHAUSTED_HEADROOM_FLOOR_MULTIPLE}, so this row is loud rather than
 * green. objectui#8541 recorded the same red first and is closed as this card's
 * duplicate.
 *
 * ⚠️ This also makes `framework` the LOOSEST ceiling in this object, measured
 * rather than asserted. All four were read from the one `3f775eeb8` console
 * build, against {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES}:
 *
 *   | ceiling              | headroom | multiple |
 *   | `framework`          |   27,755 |    0.30x |
 *   | `vendor-objectstack` |   18,848 |    0.21x |
 *   | `ui-components`      |    5,729 |    0.06x |
 *   | `i18n-locales`       |    2,900 |    0.03x |
 *
 * ⇒ it carries more slack than the next loosest and an order of magnitude more
 * than the tightest, and it abandons the 0.10x convention objectui#7399 re-pinned
 * this key and `i18n-locales` to. It is still inside one regression — 1.00x is
 * where {@link evaluateHeadroomSensitivity} calls a line blind — but "not blind"
 * is the floor this file refuses to fall through, not a standard it aims at.
 *
 * ⚠️ That table and that ranking are `3f775eeb8`'s and stay pinned to it — the
 * `i18n-locales` row in it was retired by objectui#8816's raise below. Re-read
 * on `ba20b0bc0`, `framework` is still the loosest of the four at 0.29x, but
 * against a tightest of 0.05x (`ui-components`) that is 6.1x, not an order of
 * magnitude.
 *
 * ⛔ {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES} did NOT move, and this is the
 * exact case the rule under {@link MAX_EAGER_CLOSURE_GZIP_BYTES} was written for:
 * a ceiling that rises while the sensitivity relaxes is a gate quietly retiring
 * itself. Nothing else moved either — not the other three ceilings, not the
 * aggregate, not {@link BASELINE}. One ceiling and its baseline, in one commit.
 *
 * ## Why `i18n-locales` moved UP — objectui#8816
 *
 * From 455,000 over a 446,076 payload to 465,000 over 456,196. The new baseline
 * is a reading of the tree this pair was DERIVED FOR: `main` with both claimants
 * merged into it.
 *
 * ⛔ Read what this is not, first, because the shape it resembles is the one the
 * paragraph under "Raising one" forbids. It is not "the gate fired, so the
 * number moved". objectui#8816 is a decision card opened 2026-09-09 that asks
 * exactly this question and carries three routes, and it stood unclaimed while
 * two finished pull requests queued behind it. WHICH route is the measurement
 * below, and it was taken on measurement. THAT one of the three could be taken
 * at all is a MAINTAINER RULING — director seat summon #21, decision batch #110
 * item 3, recorded on objectui#8816 at comment 5615808548 on 2026-09-10, on the
 * maintainer's reply to the recommendation of route A at comment 5615318265.
 * That reply, verbatim:
 *
 *     其他同意
 *
 * ⛔ The same ruling refuses to be read as a precedent, and the clause is
 * quoted rather than paraphrased because it governs the NEXT reader of this
 * constant rather than this one:
 *
 *     这是一次维护者裁决下的 ratchet 移动,⛔ 不是先例:下一次撞墙仍回决策箱。
 *
 * ⇒ the next change that meets this line goes back to the decision box, and
 * ⛔ this raise is not authorisation for the one after it.
 *
 * ⚠️ THE CONSTANT AND ITS RULING ARRIVED IN THAT ORDER — the wrong one — and
 * the sequence is recorded here rather than smoothed over, because a reader who
 * finds the ruling above and the number below will otherwise reconstruct a
 * history that did not happen. The pair landed in `fffa30d3f` at 06:05:37Z on
 * 2026-09-10 as a RIDER inside objectui#8901 (`fix(data-objectstack): a refused
 * view read is not an object with no saved views`), about two hours and forty
 * minutes BEFORE the ruling was recorded, and ⛔ not in the dedicated pull
 * request the ruling's execution clause asks for. What stood in for the ruling
 * at that moment was the maintainer's instruction of 2026-09-10 that red pull
 * requests are RESOLVED rather than parked — a PRIORITY instruction, read on
 * the day as authorising the route as well as the urgency. Whether it did was
 * named as an open fork while the fork was still open, and the maintainer then
 * settled it as A. ⇒ the number is the ruled number, so ⛔ moving a ruled
 * constant back in order to re-land it in the ruled shape is refused: that
 * lands `main` red on this line for form. What was wrong is the record, and a
 * record is repaired by writing it — objectui#8816, these paragraphs.
 *
 * ⛔ WHAT THE BYTES BUY — one console build per row, each from the repo ROOT,
 * `i18n-locales` read out of the `apps/console/dist/eager-closure.json` the
 * build itself writes. Four builds, one container, one instrument, so the
 * deltas are directly comparable:
 *
 *   | tree                                   | `i18n-locales` | moved by |
 *   | `bbe285ee7` — `main`                   |        454,602 |        — |
 *   | + objectui#8901, its merge `3949cf3a3` |        455,271 |     +669 |
 *   | + objectui#8888, its merge `ea5eab7b3` |        455,519 |     +917 |
 *   | both, their merge `ba20b0bc0`          |        456,196 |   +1,594 |
 *
 * The two deltas sum to 1,586 against a measured 1,594, so gzip's dictionary
 * hands back nothing across them: two independent claimants on this chunk are
 * ADDITIVE to within 8 bytes. That is the fact a SHARED budget needs and the one
 * a per-pull-request reading cannot produce — each is 271 and 519 bytes over
 * alone, together they are 1,196 over, and neither single reading licenses that
 * sum without the third build.
 *
 * The bytes are THIRTEEN localization keys in ten locales and nothing else.
 * objectui#8901 adds three `console.savedViews*` strings so that a REFUSED
 * saved-view read stops rendering as "this object has no saved views";
 * objectui#8888 adds ten `chatbot.build.*` strings so the AI build-progress
 * panel stops showing English literals inside a Chinese conversation. Neither
 * ships a dependency or a component into this closure: `plugin-chatbot` is lazy
 * and outside it, and objectui#8901's adapter growth landed in
 * `vendor-objectstack`, which measured 1,236,299 on ALL FOUR builds — the lit
 * control saying the movement is this chunk's and no other's.
 *
 * ⛔ WHY NOT TRIM INSTEAD, which is the half a raise has to answer. Measured,
 * per claimant:
 *
 *   - objectui#8888's ten keys include five generic console nouns (`Objects`,
 *     `Views`, `Dashboards`, `App`, `Sample data`), so reuse looks available.
 *     It is not: only `Objects` and `Dashboards` have any pre-existing
 *     equivalent in the `en` pack, and each of those already exists THREE times
 *     under three per-surface namespaces (`appDesigner.*`,
 *     `console.commandPalette.*`, `search.type*`). Per-surface keys are this
 *     pack's convention and cross-surface reuse is the deviation. Best measured
 *     saving 128 bytes against a 519-byte overage.
 *   - objectui#8901's three keys have NO reuse candidate, and that is
 *     structural rather than incidental: those strings exist precisely because
 *     saying what the neighbouring `console.importMappings*` strings say is the
 *     runtime lie the card was filed to remove.
 *   - Shortening the copy is the objectui#6759 lever ("say less, in ten
 *     languages") and it is ⛔ refused here. Widening a ceiling to get a green
 *     tick and narrowing a payload to get one are the same error facing in
 *     opposite directions; this file already forbids the first.
 *
 * ⇒ Trimming cannot reach 1,196 bytes inside these two changes. What CAN reach
 * it is outside them, and it is recorded here because it is the work that makes
 * the next raise unnecessary: `pnpm check:i18n-dead-keys` reports 364 candidates
 * across 47 namespaces, 127 of them CONFIRMED with no textual footprint anywhere
 * in this repository, in ten locales each. That gate is report-only by design
 * and `@object-ui/i18n` PUBLISHES these packs, so deleting a key is a
 * published-surface removal and a decision, not a byte-saving. It needs its own
 * card and its own reverse verification — objectui#8816's route C note says so
 * in as many words — and it is ⛔ deliberately not ridden in on a localization
 * change.
 *
 * ## Why the new headroom is 0.10x and NOT the 804 bytes the overage needed
 *
 * The minimal raise — 457,000, exactly enough to admit both claimants — is the
 * one option this card's own evidence rules OUT. objectui#8816 is not filed
 * about a full budget. It is filed about what a budget with ~0 headroom DOES:
 * the gate weighs the MERGE REF, so a sibling change that adds locale keys and
 * lands first turns an in-flight, not-itself-over pull request red in the merge
 * queue — an arithmetic collision that reads as a defect in that diff, and sends
 * its author to investigate something that is not there. objectui#8554 is the
 * same mechanism one step earlier: `framework` sat at 70,999 against 71,000 and
 * printed a GREEN sensitivity row while it did, because
 * {@link evaluateHeadroomSensitivity} had no floor at the time. Re-pinning to
 * 804 bytes would reproduce both inside a week. ⭐ That card is also where the
 * convention this paragraph reaches for stopped being prose: the tenth chosen
 * here is now {@link EXHAUSTED_HEADROOM_FLOOR_MULTIPLE}, and a re-pin that
 * ignores it reds instead of merely disagreeing with a comment.
 *
 * So the size comes from this key's own convention rather than from the overage:
 * 8,804 bytes = 0.10x {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES}, against the
 * 8,924 (0.10x) the retired pair carried — slightly TIGHTER as a ratio, and on
 * `ba20b0bc0` the second-tightest of the four ceilings (`ui-components` 0.05x,
 * `i18n-locales` 0.10x, `vendor-objectstack` 0.19x, `framework` 0.29x).
 *
 * ⚠️ What it buys, stated as the interval it is rather than as a key count. Per
 * key-times-locale this chunk cost 9.2 bytes for objectui#8888's ten short
 * progress phrases and 22.3 bytes for objectui#8901's three long sentences — a
 * 2.4x spread between two real claimants one shift apart, so ⛔ a quota written
 * in keys is not derivable from this measurement. 8,804 bytes is between ~395
 * and ~958 key-times-locale slots: roughly 40 to 96 keys across ten locales.
 *
 * ⚠️ And how long that is, measured rather than hoped. The retired pair landed
 * on `177afeba1`, 2026-09-03, at 446,076; `main` measured 454,602 on
 * `bbe285ee7`, 2026-09-10. That is 8,526 bytes in seven days, with the last 398
 * of them claimed by two independent changes inside ONE shift. At that arrival
 * rate this raise is about a week of runway, not a settlement — so ⛔ do not read
 * it as one, and do not read a second raise as routine because this one was
 * taken. The structural answer is the one this file already names: the aggregate
 * is the correct place for this constraint to live, and taking the catalogues
 * OUT of the eager closure is what retires this line instead of moving it.
 *
 * ⛔ Nothing else moved. Not {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES} —
 * this is the exact case the rule under {@link MAX_EAGER_CLOSURE_GZIP_BYTES} was
 * written for, and a ceiling that rises while the sensitivity relaxes is a gate
 * quietly retiring itself. Not the other three per-chunk ceilings, weighed on
 * the same four builds and unchanged. Not {@link MAX_EAGER_CLOSURE_GZIP_BYTES}:
 * the aggregate carried 23,507 bytes of headroom (0.26x) with BOTH claimants on
 * it, so it never objected and there is nothing to re-pin. One ceiling and its
 * baseline, in one commit.
 *
 * ## Why `i18n-locales` became `i18n-locale-en` — objectui#7479
 *
 * ⭐ The structural answer the section above named as the only thing that
 * retires that line — "taking the catalogues OUT of the eager closure is what
 * retires this line instead of moving it" — has landed. `@object-ui/i18n` no
 * longer re-exports ten catalogues from its entry; `en` stays statically
 * resident as `fallbackLng` and as the app-shell splash's synchronous
 * dictionary, and the other nine are `import()`ed per locale.
 * `apps/console/vite.config.ts` gives each catalogue its own `advancedChunks`
 * group, because ten catalogues in ONE group are one chunk and one eager member
 * would make all ten eager again.
 *
 * Two full console builds in one container, same instrument, the second
 * differing from the first only by that change:
 *
 *   | reading                         |   control |     after |     delta |
 *   |---------------------------------|----------:|----------:|----------:|
 *   | aggregate eager closure         | 3,575,370 | 3,164,817 |  -410,553 |
 *   | eager chunks / total            |    50/518 |    51/528 |           |
 *   | `i18n-locales` (retired key)    |   456,196 |         - |           |
 *   | `i18n-locale-en` (this key)     |         - |    40,415 |           |
 *   | `i18n-runtime` (provider/hooks) |         - |     5,329 |           |
 *   | `vendor-objectstack`            | 1,236,315 | 1,236,315 |         0 |
 *   | `ui-components`                 |   394,726 |   394,718 |        -8 |
 *   | `framework`                     |    80,414 |    80,430 |       +16 |
 *
 * The last three rows are the control that makes the first one readable: the
 * bytes did not MOVE to a roomier chunk — objectui#7399 named that route and
 * refused it — they left the eager closure. The nine deferred catalogues weigh
 * 405.5 KB gzipped, and the browser fetches exactly one of them, only when the
 * viewer's locale is not `en`.
 *
 * ⛔ Two things this is NOT. It is not a raise: every constant this card moved
 * moved DOWN or was replaced by a tighter one, and no build that passed before
 * it and measures under the new figures fails after it. And it is not a
 * re-chunking — `scripts/check-eager-locale-catalogues.mjs` is the half that
 * makes that checkable, weighing WHICH catalogues a page load pulls rather than
 * what they cost, because a byte ceiling cannot tell "left the closure" from
 * "moved to a chunk with more room".
 *
 * {@link MAX_EAGER_CLOSURE_GZIP_BYTES} moved in the same commit and had to:
 * with the aggregate ceiling left at 3,597,000 over a 3,164,817 payload the
 * headroom would have been 432,183 bytes — 4.74x the regression this gate must
 * catch — and {@link evaluateHeadroomSensitivity} calls anything above 1.00x an
 * ERROR about the gauge. That is the blind band this file opens on every large
 * shrink, and closing it in the same change is what "drift in the SHRINKING
 * direction is no longer free" asks for.
 *
 * ## Raising one
 *
 * Same discipline as {@link MAX_EAGER_CLOSURE_GZIP_BYTES}, and the same two
 * constraints, both CHECKED in `scripts/__tests__/check-eager-closure-budget.test.ts`:
 * every ceiling passes on the measurement in {@link PER_CHUNK_BASELINE}, and its
 * headroom stays under {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES} so a repeat
 * of the incident that motivated the gate cannot fit inside it. ⛔ Do not LOWER
 * one below the measured figure to express an aspiration: this is a ratchet, and
 * a ceiling under today's reality is a gate that lands red on `main`, which is
 * how a budget gets switched off rather than met. Shrinking the payload is real
 * work with its own cards (objectui#5324 names the candidates); when it lands,
 * re-measure and lower both numbers together.
 */
export const PER_CHUNK_GZIP_CEILINGS = Object.freeze({
  // Raised once with the aggregate above, same authorisation, same cause —
  // `@objectstack/spec` 17.3.0's browser-dist prose growth lands in THIS chunk.
  // Headroom 18,971 bytes = 0.21x REGRESSION_THIS_GATE_MUST_CATCH_BYTES, the
  // proportion the retiring pair carried (18,539 = 0.20x).
  'vendor-objectstack': 1_254_000,
  // ⭐ LOWERED, and RE-KEYED, by objectui#7479 — this line used to read
  // `'i18n-locales': 465_000` and budget TEN catalogues. Nine of them are
  // `import()`ed on demand now, so the chunk that name pointed at no longer
  // exists and the eager catalogue is `en` alone: 456,196 -> 40,415 gzipped
  // bytes, measured on the two console builds recorded under "Why
  // `i18n-locales` became `i18n-locale-en`" above. ⛔ This is a TIGHTENING and
  // must not be read as the raise the retired key kept needing: no build that
  // passed before this edit and measures under 50,000 fails after it, and the
  // ~9.5 KB of runway left here is `en`'s alone rather than ten packs' shared.
  // Headroom 9,585 bytes = 0.11x REGRESSION_THIS_GATE_MUST_CATCH_BYTES over the
  // baseline below — just above the 0.10x floor, this file's own convention for
  // a deliberate re-pin, and the first time this key has cleared that floor
  // without a declared allowance holding it open.
  'i18n-locale-en': 50_000,
  // Raised by the maintainer ruling of 2026-09-08, ⛔ not by a measurement here:
  // `main` had been red on this line since `f76f43628`. The bytes that put it
  // there were UNATTRIBUTED when this moved and have since been measured to
  // `f76f43628` (+262) and `e76634cc8` (+984) — see the table under "Why
  // `framework` moved UP" above. Headroom 27,755 bytes = 0.30x
  // REGRESSION_THIS_GATE_MUST_CATCH_BYTES on `3f775eeb8` — the loosest of the
  // four. See "Why `framework` moved UP" above for what that costs.
  framework: 100_000,
  'ui-components': 399_000,
});

/**
 * The measurement {@link PER_CHUNK_GZIP_CEILINGS} was derived from, read out of
 * the report a `vite build` of `apps/console` wrote. Provenance is per KEY, not
 * per file, and saying so is the point — a comment that names one commit for
 * three numbers taken on two is the drift objectui#6631 is open about:
 *
 *   - `vendor-objectstack` — `34a1578ef` (objectui#7122), re-measured when the
 *     `@objectstack/spec` 17.3.0 family bump moved this chunk and its ceiling
 *     was raised with the aggregate. ⚠️ It shared {@link BASELINE}'s build until
 *     objectui#7479 moved the aggregate onto a later commit; it superseded
 *     `2c8474c04` (objectui#5490). Its value is unmoved and both console builds
 *     objectui#7479 took re-measured it at 1,236,315 — a CONTROL for that
 *     card's delta, not a re-baseline.
 *   - `ui-components` — `2c8474c04` (objectui#5490).
 *   - `framework` — `3f775eeb8`, the `main` tip this raise's branch was cut
 *     from, read out of the `apps/console/dist/eager-closure.json` written by
 *     `pnpm turbo run build --filter='./packages/*'` followed by
 *     `pnpm --filter @object-ui/console build`, run on that tree with NO diff of
 *     its own applied. See "Why `framework` moved UP" above for the ruling it
 *     was measured for and what that raise costs. It supersedes objectui#7399's
 *     `e307c9896` reading, objectui#7173's before that, and objectui#6759's
 *     `a64e96ca8` before that. ⚠️ Unlike the entry below it, this one IS a
 *     reading of an unmodified tree — the change it pins lives entirely in this
 *     file, and `scripts/check-*.mjs` is not a console build input — so the
 *     {@link BASELINE} argument DOES cover it, and it is ⛔ NOT comparable to
 *     the `i18n-locales` figure below, which is an older build on another commit.
 *   - `i18n-locale-en` — `755d34a5f` (objectui#7479), the commit that carries
 *     the lazy-catalogue change, read from its own console build. It REPLACES
 *     the retired `i18n-locales` key, whose last reading was `ba20b0bc0`
 *     (objectui#8816) and `e307c9896` (objectui#7399) before that. ⚠️ Unlike
 *     every other entry here it shares BASELINE's commit exactly, and that is
 *     the point rather than a coincidence: the aggregate and this key moved for
 *     the SAME reason, in the same commit, off the same pair of builds, so the
 *     -410,553 aggregate delta and the 456,196 -> 40,415 catalogue delta are
 *     subtractable against each other. The control build they are subtracted
 *     from is `origin/main` `d8b4739d4`, same container, same instrument.
 *
 *     ⚠️ It WAS a FORWARD reading — the only entry here that ever has been —
 *     and it is not one any more. It names the state `main` reaches once
 *     objectui#8901 and objectui#8888 have BOTH landed, and both have:
 *     `fffa30d3f` at 2026-09-10T06:05:37Z and `8ea3beee4` at
 *     2026-09-10T06:05:40Z, three seconds apart and both ancestors of `main`.
 *     ⇒ the gap this entry used to describe is CLOSED, and the sentence that
 *     described it is history: while only one claimant had landed the live
 *     payload sat below this constant (455,271 and 455,519, both measured) and
 *     `pnpm check:eager-closure` printed MORE headroom than arithmetic on these
 *     two constants gives. ⛔ Do not read a current headroom out of that — the
 *     figure in force is the one the gate prints on YOUR build. Recorded
 *     forward on purpose, and the reason outlives the gap: a shared budget with
 *     two admitted claimants has no single-commit baseline that is not stale
 *     the moment the second one lands, and erring toward the larger payload is
 *     the direction that cannot hide growth.
 *
 *     ⚠️ Unlike the entries above it, this is a reading of a tree carrying
 *     diffs of its own — the two claimants — which is the point rather than a
 *     contaminant: their bytes are the subject. The
 *     `scripts/vite-*.ts`-versus-`scripts/check-*.mjs` argument {@link BASELINE}
 *     makes DOES cover the ceiling edit itself, because this file is not a
 *     console build input; that was checked rather than assumed, and the check
 *     is recorded on objectui#8816.
 *
 * Exported so the ceilings are CHECKED against it instead of merely asserted
 * in this comment.
 *
 * ⚠️ These readings are on DIFFERENT commits from {@link BASELINE} above —
 * except `i18n-locale-en`, which as of objectui#7479 shares BASELINE's commit
 * exactly — and WHICH ONE IS LATER flips every time either side is
 * re-baselined, so read the commit names, never a direction asserted here. As
 * of objectui#7479 the AGGREGATE is the later reading: BASELINE's `755d34a5f`
 * is dated 2026-09-11 against `2c8474c04` on 2026-08-25 for `ui-components`
 * here, and `34a1578ef` (2026-09-06, objectui#7122) for `vendor-objectstack`.
 * This paragraph asserted the reverse,
 * in the present tense, from objectui#5490 until objectui#6778 — true when it
 * was written, then left standing while three aggregate re-baselines moved
 * {@link BASELINE} out from under it.
 *
 * ⚠️ Do not expect `git show` to answer for all of these. Squash-merge keeps the
 * landing commit and drops the PR branch, so of the three named above only
 * `2c8474c04` is an ancestor of `main`; `3d257c85a` still resolves as an object
 * but is not on `main` (it landed as `350509b53`), and `a64e96ca8` is not an
 * object in this repository at all. That is why every hash here is cited WITH
 * its issue: the issue outlives the hash.
 *
 * The aggregate ceiling and its baseline were deliberately NOT touched by
 * objectui#5490: objectui#5468 had ruled that the aggregate line "stays as
 * shipped", and moving it — in either direction — is the maintainer's call. That
 * is why the provenance splits in the first place.
 *
 * ⛔ The stale direction is the cheap half. The expensive half is the CONCLUSION
 * this paragraph used to draw from it: that the aggregate ceiling sat far above
 * the payload — 4,086,000 over the 3,298,620 reading, 787,380 bytes of headroom,
 * 8.64x {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES} — and that these per-chunk
 * ceilings were therefore the only lines holding the three biggest chunks in
 * place. That was accurate for objectui#5490 and is now false: objectui#5924,
 * objectui#6683 and objectui#6776 lowered the aggregate ceiling three times,
 * onto 3,268,000, and it is back in range and doing work.
 *
 * Checked rather than argued, which is the rule everywhere else in this file. A
 * full console build on `e33b44796` and `pnpm check:eager-closure` printed:
 *
 *     ✅ aggregate closure          3149.2 KB measured / 3191.4 KB ceiling (headroom 42.2 KB = 0.47x)
 *     ✅ chunk `vendor-objectstack`  925.7 KB measured /  944.3 KB ceiling (headroom 18.6 KB = 0.21x)
 *     ✅ chunk `framework`           492.9 KB measured /  500.0 KB ceiling (headroom  7.1 KB = 0.08x)
 *     ✅ chunk `ui-components`       386.2 KB measured /  389.6 KB ceiling (headroom  3.4 KB = 0.04x)
 *
 * All four sit inside one regression, which is the whole of what "in range"
 * means here — {@link evaluateHeadroomSensitivity} calls 1.00x an error. So the
 * relationship these ceilings have to the aggregate is no longer "we are the
 * half that still works". It is narrower, and still worth having: WHICH line is
 * tightest moves with every build and is not restated here — the ranking this
 * sentence used to assert had inverted by the time anyone re-read it
 * (objectui#7518) — and whichever it is, these say WHERE, which one total
 * never can.
 *
 * ⛔ Do not size a re-baseline off the figures above. They are ONE dated run,
 * taken before objectui#7399 re-attributed `framework`, so its `framework` row
 * weighs locale catalogues that line no longer holds. They are recorded so this
 * paragraph rests on a measurement instead of an argument; the answer in force
 * is the table the gate prints on YOUR build. That this prose
 * went three re-baselines stale while the numbers beside it could not
 * (objectui#6778) is the reason to distrust the prose first.
 *
 * Keys must match {@link PER_CHUNK_GZIP_CEILINGS} exactly (a test enforces it):
 * a ceiling with no measurement behind it is a number someone guessed, and a
 * measurement with no ceiling weighs nothing.
 */
export const PER_CHUNK_BASELINE = Object.freeze({
  // `34a1578ef`, the same build as BASELINE above (objectui#7122).
  'vendor-objectstack': 1_235_029,
  // `755d34a5f` (objectui#7479) — the SAME console build as
  // BASELINE above, so the two are directly comparable, and the same instrument
  // and container as the control build it is subtracted from. It supersedes
  // objectui#8816's `ba20b0bc0` reading of the retired `i18n-locales` key.
  'i18n-locale-en': 40_415,
  // `3f775eeb8`, its OWN console build — ⛔ not the one above it and not
  // BASELINE's. Moved with the ceiling in the same commit, per the maintainer
  // ruling of 2026-09-08 and the rule stated under "Raising one".
  framework: 72_245,
  'ui-components': 391_095,
});

/**
 * The LOWER bound on a ceiling's headroom, as a fraction of
 * {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES} (objectui#8554).
 *
 * ## The half this closes
 *
 * {@link evaluateHeadroomSensitivity} asks whether a ceiling is still close
 * enough to its payload to mean anything, and until this constant it asked that
 * in ONE direction only: a ceiling more than one regression ABOVE its payload is
 * blind, and every other row drew a green tick — one byte of headroom included.
 * A spent ceiling is not a measurement of this bundle either. It is a
 * measurement of the NEXT change, whatever that turns out to be.
 *
 * The cost is recorded rather than argued, twice. `framework` stood at 70,999
 * gzipped bytes against a 71,000 ceiling across at least two merges, printing a
 * green sensitivity row the whole time, and then `main` went red on an ordinary
 * change. `i18n-locales` stood at 398 bytes and did something worse: this gate
 * weighs the merge ref, so two independent, finished pull requests each added
 * under a kilobyte to that chunk and whichever the queue weighed SECOND turned
 * red for the other one's bytes. An exhausted ceiling does not only red the
 * trunk — it reds an innocent diff and misnames the cause, while this half
 * prints a green tick at the bottom of the same run.
 *
 * ## Why a tenth, and why that is not a reading of today's rows
 *
 * This file already had an answer and only ever wrote it in prose. Every
 * deliberate re-pin in {@link PER_CHUNK_GZIP_CEILINGS} sizes the new headroom at
 * a tenth of the regression: objectui#7399 re-pinned two keys to it, and
 * objectui#8816 rejected the minimal raise that would have admitted its two
 * claimants exactly — choosing, in as many words, this key's own convention over
 * the overage, and citing objectui#8554 for why the minimal raise would
 * reproduce both failures inside a week. The maintainer ruling that authorised
 * that raise was taken on that reasoning.
 *
 * ⇒ the bound is this file's own already-taken decision, promoted from a comment
 * into the predicate. ⛔ It was NOT picked by asking which rows are green today.
 * What it does to today's rows is recorded, after the fact and in that order, in
 * {@link EXHAUSTED_HEADROOM_ALLOWANCES}.
 *
 * ⛔ Never raise this to quiet a row. It is a floor on a floor: raising it buys
 * silence for a ceiling that has stopped measuring, which is the defect and not
 * the cure — the same rule the blind side states in the other direction.
 */
export const EXHAUSTED_HEADROOM_FLOOR_MULTIPLE = 0.1;

/**
 * Ceilings whose headroom was ALREADY under
 * {@link EXHAUSTED_HEADROOM_FLOOR_MULTIPLE} on the day that floor landed, each
 * pinned at the headroom it measured that day (objectui#8554).
 *
 * ## Why a table and not simply a lower floor
 *
 * Two rows were under a tenth of the regression when the floor was written. A
 * floor low enough to clear them would be green on a board whose tightest line
 * is the exact instance this card was filed about — it would say nothing, which
 * is the defect wearing the cure's clothes. A floor without them reds `main` on
 * landing, which is how a budget gets switched off rather than met. So the bound
 * stays where this file's own convention put it, and the debt is DECLARED here,
 * at the byte.
 *
 * ## What an entry does
 *
 * A listed ceiling passes while its headroom is at least the figure below and
 * reds the moment it gets TIGHTER. The gate is therefore loud immediately: every
 * listed row is named in the PASSING verdict too, not only when it fires. Each
 * entry is a ratchet that can be paid off and never spent.
 *
 * ⛔ No figure here may ever be LOWERED. Lowering one turns this object from a
 * record of debt into a supply of headroom, and the row it was written about
 * goes exactly as silent as it was before this card.
 *
 * ⛔ No row may be ADDED to buy silence. A ceiling that cannot clear the floor is
 * a ceiling set at the wrong number; the answer is the bytes, or a deliberate
 * authorised re-pin, never a new line in this object. The unit test pins these
 * contents exactly, so an edit in either direction is a visible, deliberate act
 * rather than a number that drifted.
 *
 * ⛔ These are not ceilings and nothing may be raised to satisfy one. The
 * `ui-components` number in particular is an open decision (objectui#7848) and
 * this table ⛔ does not answer it — it only stops the gate being silent while
 * that decision stands unanswered.
 *
 * Both figures were read from one full console build on `2596b1b85`, from the
 * same report the gate reads. ⚠️ `i18n-locales` carries the pair objectui#8816's
 * maintainer ruling set eight days earlier, whose prose calls its headroom
 * "0.10x": rendered to two decimals it is, measured it is 0.0966x, so the floor
 * catches it by 310 bytes. That is a rounding artifact in the prose, ⛔ not a
 * finding about the ruling, and ⛔ not a reason to bend the bound to 0.095 —
 * bending it to clear a named row is choosing the bound by today's board, which
 * is the one move this card may not make.
 *
 * ⭐ `ui-components` was read TWICE while this was being written, an hour apart,
 * and it moved: 394,708 on `e8b7b0785` and 394,711 five merges later, none of
 * them about this chunk. The console build is deterministic on a fixed tree —
 * checked, two builds byte-identical across all four budgeted chunks — so those
 * three bytes are content and not noise, and the first reading was already stale
 * when it was taken. That is this card's whole thesis arriving during its own
 * fix: the tightest line on the board moves under ordinary traffic and nothing
 * said so.
 *
 * ⇒ that reading is also why these figures are NOT compared at the byte. See
 * {@link EXHAUSTED_HEADROOM_ALLOWANCE_GRANULARITY_MULTIPLE}, which is the unit
 * the comparison is made in and the reason a red here is a red a reader can see.
 */
export const EXHAUSTED_HEADROOM_ALLOWANCES = Object.freeze({
  // ⭐ `i18n-locales: 8_804` stood here until objectui#7479. It is REMOVED, not
  // lowered, and the distinction is the whole of why that is allowed: the rule
  // above forbids LOWERING a figure, because a lowered figure is headroom
  // supplied to a row that still exists. This row's chunk does not exist any
  // more — nine of the ten catalogues it weighed are `import()`ed on demand, and
  // the one that stays is budgeted under its own key at a headroom of 0.11x,
  // ABOVE the floor and needing no allowance at all. That is the debt PAID, in
  // the only currency this table takes: the row cleared the floor on its own.
  // ⛔ Re-adding a locale row here would mean the catalogues came back.
  'ui-components': 4_289,
});

/**
 * The unit a declared allowance is compared in, as a fraction of
 * {@link REGRESSION_THIS_GATE_MUST_CATCH_BYTES}. A listed row reds when its
 * headroom falls a whole one of these below its pinned figure — ⛔ not when it
 * falls one BYTE below it.
 *
 * ## Why the byte is the wrong unit, demonstrated rather than argued
 *
 * This gate renders three numbers per row, and every one of them is rounded:
 * measured and headroom through {@link kb} at one decimal of a KiB, and the
 * multiple at two decimals of a regression. Take `ui-components` at its pinned
 * 4,289 bytes of headroom and remove ONE byte — the boundary a byte-exact
 * comparison would red on:
 *
 *     headroom 4,289  ->  385.5 KB measured / headroom 4.2 KB / 0.05x
 *     headroom 4,288  ->  385.5 KB measured / headroom 4.2 KB / 0.05x
 *
 * ⇒ ⭐ identical. Every column. A byte-exact ratchet fires with a red cross above
 * an evidence table that is character-for-character the table the green run
 * printed, so the reader cannot see what moved, cannot tell their own diff from
 * the drift under it, and has nothing to act on. That is the same defect
 * objectui#8554 is about — a number nobody can read — moved one level in.
 *
 * ## Why a hundredth, specifically
 *
 * It is the coarser of this file's two rendering grids: 0.01x is 911.36 bytes,
 * where one tenth of a KiB is 102.4. Choosing the coarser one is what makes a
 * red visible in BOTH columns rather than only the finer of them. Across the
 * same trip point that is:
 *
 *     headroom 4,289  ->  385.5 KB measured / headroom 4.2 KB / 0.05x
 *     headroom 3,377  ->  386.4 KB measured / headroom 3.3 KB / 0.04x
 *
 * It is also the next decade of the unit this whole file is denominated in —
 * 1.00x is blind, 0.10x is the floor, 0.01x is the grain — so the instrument
 * measures at one resolution throughout instead of claiming an 89 KB question
 * and answering a one-byte one.
 *
 * ## What this is NOT
 *
 * ⛔ Not a raise, and ⛔ not headroom to spend. The pinned figures do not move,
 * the table stays pay-down-only, and paying a row down moves its trip point up
 * with it. It coarsens WHEN a declared row reds, ⛔ never whether it is
 * declared, and ⛔ never the {@link EXHAUSTED_HEADROOM_FLOOR_MULTIPLE} floor
 * itself, which is unchanged and still reds an undeclared row at 0.10x.
 *
 * ⚠️ ⛔ It does not make a declared row's red CLEARABLE by the pull request that
 * trips it — nothing at this bound can, while a row's headroom is somebody
 * else's open decision. What it does is stop that red firing on drift too small
 * to see, and the verdict text for a declared row says whose question it is
 * rather than sending its author to audit their own diff.
 */
export const EXHAUSTED_HEADROOM_ALLOWANCE_GRANULARITY_MULTIPLE = 0.01;

/**
 * The report shape this checker understands. v2 added `files[].name` — the
 * chunk name rolldown itself recorded — which is what the per-chunk ceilings
 * below are keyed on. Refusing a v1 report is the point: without those names
 * every budgeted chunk would be "absent", and the difference between "this
 * build predates per-chunk budgets" and "vendor-objectstack has vanished from
 * the closure" must not be a guess.
 */
export const SUPPORTED_REPORT_VERSION = 2;

const DEFAULT_REPORT_PATH = 'apps/console/dist/eager-closure.json';

/**
 * Validate a parsed report before any verdict is read from it.
 *
 * Every check here is a counter-probe, and they all guard the same asymmetry:
 * this gate's failure mode is SILENT. A missing field read as zero, a report
 * left over from an older build, a walk that returned the entry chunk alone —
 * each produces a SMALL number, and a budget check reads a small number as good
 * news. So a report that cannot be trusted must be an ERROR, never a pass.
 *
 * @param {unknown} report
 * @returns {string[]} problems; empty means the report may be read
 */
export function validateReport(report) {
  const problems = [];
  if (report === null || typeof report !== 'object') {
    return ['report is not an object'];
  }
  const r = /** @type {Record<string, unknown>} */ (report);

  if (r.reportVersion !== SUPPORTED_REPORT_VERSION) {
    problems.push(
      `reportVersion is ${JSON.stringify(r.reportVersion)}, expected ${SUPPORTED_REPORT_VERSION} — ` +
        `the emitter in apps/console/vite.config.ts and this checker have drifted apart`,
    );
    // Every field check below assumes v1's names, so they would report noise.
    return problems;
  }

  for (const key of ['eagerChunkCount', 'totalChunkCount', 'eagerGzipBytes', 'eagerRawBytes']) {
    if (typeof r[key] !== 'number' || !Number.isFinite(r[key]) || r[key] < 0) {
      problems.push(`${key} is ${JSON.stringify(r[key])}, expected a non-negative number`);
    }
  }
  if (!Array.isArray(r.files)) problems.push('files is not an array');
  if (!Array.isArray(r.entryChunks) || r.entryChunks.length === 0) {
    problems.push('entryChunks is empty — the walk had no roots, so it measured nothing');
  }
  if (problems.length > 0) return problems;

  const files = /** @type {{ fileName: string, gzipBytes: number }[]} */ (r.files);
  const eagerChunkCount = /** @type {number} */ (r.eagerChunkCount);
  const totalChunkCount = /** @type {number} */ (r.totalChunkCount);
  const eagerGzipBytes = /** @type {number} */ (r.eagerGzipBytes);

  // The entry chunk alone IS the gauge this replaces. One chunk is not a
  // closure, and a walk that collapsed to its roots must not be read as a
  // shrinking bundle.
  if (eagerChunkCount < 2) {
    problems.push(
      `eagerChunkCount is ${eagerChunkCount} — the closure collapsed to its entry chunk(s), ` +
        `which is exactly the blind gauge this check replaces (objectui#5324)`,
    );
  }
  // The other direction: if everything is eager there is no lazy boundary and
  // the number is "the whole bundle", which no page load pays.
  if (eagerChunkCount >= totalChunkCount) {
    problems.push(
      `eagerChunkCount (${eagerChunkCount}) is not less than totalChunkCount (${totalChunkCount}) — ` +
        `the walk is not separating static from dynamic imports`,
    );
  }
  if (files.length !== eagerChunkCount) {
    problems.push(`files has ${files.length} entries but eagerChunkCount is ${eagerChunkCount}`);
  }
  // v2: every member carries the chunk name rolldown recorded, and that name is
  // the key the per-chunk ceilings look up. A member without one is not a
  // cosmetic gap — its bytes would be weighed by the aggregate and by nothing
  // else, and a budgeted chunk hiding in it would read as ABSENT.
  const unnamed = files.filter((f) => typeof f?.name !== 'string' || f.name === '');
  if (unnamed.length > 0) {
    const shown = unnamed.slice(0, 5).map((f) => f?.fileName ?? '<no fileName>');
    problems.push(
      `${unnamed.length} of ${files.length} files carry no chunk \`name\` (${shown.join(', ')}` +
        `${unnamed.length > shown.length ? ', …' : ''}) — per-chunk ceilings key on that field, ` +
        `so a report without it cannot be weighed per chunk`,
    );
  }

  const summed = files.reduce((n, f) => n + (typeof f?.gzipBytes === 'number' ? f.gzipBytes : NaN), 0);
  if (!Number.isFinite(summed) || summed !== eagerGzipBytes) {
    problems.push(
      `eagerGzipBytes (${eagerGzipBytes}) does not equal the sum of files[].gzipBytes (${summed}) — ` +
        `the report is internally inconsistent, so neither number can be trusted`,
    );
  }
  return problems;
}

/**
 * @param {object} input
 * @param {unknown} input.report        parsed `eager-closure.json`, or null when absent
 * @param {number} [input.budgetBytes]  ceiling to compare against
 * @param {string} [input.reportPath]   path the report was read from, for messages
 * @returns {{ status: 'pass' | 'fail' | 'error', message: string, gzipBytes: number | null,
 *             budgetBytes: number, chunkCount: number | null, totalChunkCount: number | null }}
 */
export function evaluateClosureBudget({
  report,
  budgetBytes = MAX_EAGER_CLOSURE_GZIP_BYTES,
  reportPath = DEFAULT_REPORT_PATH,
} = {}) {
  const base = { budgetBytes, gzipBytes: null, chunkCount: null, totalChunkCount: null };

  if (report === null || report === undefined) {
    return {
      ...base,
      status: 'error',
      message:
        `No eager-closure report at ${reportPath}. It is written by ` +
        `\`emitEagerClosureReport\` in apps/console/vite.config.ts during \`vite build\`, so an ` +
        `absent report means the console was not built — or was built by a config that no ` +
        `longer emits it. This is a broken gauge, not a passing budget.`,
    };
  }

  const problems = validateReport(report);
  if (problems.length > 0) {
    return {
      ...base,
      status: 'error',
      message: `Eager-closure report at ${reportPath} cannot be trusted:\n  - ${problems.join('\n  - ')}`,
    };
  }

  const r = /** @type {{ eagerGzipBytes: number, eagerChunkCount: number, totalChunkCount: number }} */ (report);
  const gzipBytes = r.eagerGzipBytes;
  const shared = {
    budgetBytes,
    gzipBytes,
    chunkCount: r.eagerChunkCount,
    totalChunkCount: r.totalChunkCount,
  };

  if (gzipBytes > budgetBytes) {
    const over = gzipBytes - budgetBytes;
    return {
      ...shared,
      status: 'fail',
      message:
        `Console eager closure is ${kb(gzipBytes)} KB gzipped across ${r.eagerChunkCount} chunks — ` +
        `${kb(over)} KB over the ${kb(budgetBytes)} KB budget.\n` +
        `These are the bytes every console page load fetches and parses before the app renders; ` +
        `they are not deferred by any lazy import.\n` +
        `If the growth is intended, raise MAX_EAGER_CLOSURE_GZIP_BYTES in ` +
        `scripts/check-eager-closure-budget.mjs deliberately and say in the PR what the bytes ` +
        `buy — do not widen it just to get a green check.`,
    };
  }

  return {
    ...shared,
    status: 'pass',
    message:
      `Console eager closure is ${kb(gzipBytes)} KB gzipped across ${r.eagerChunkCount} of ` +
      `${r.totalChunkCount} chunks (budget: ${kb(budgetBytes)} KB, ` +
      `headroom: ${kb(budgetBytes - gzipBytes)} KB).`,
  };
}

const kb = (bytes) => (bytes / 1024).toFixed(1);

/**
 * Fold the report's eager members into `name -> { gzipBytes, fileNames }`.
 *
 * Chunks are SUMMED per name rather than matched one-to-one, so a group that
 * one day emits two chunks under the same name cannot let bytes out from under
 * its ceiling by splitting. Members with no name are skipped here and refused
 * upstream by {@link validateReport}, which is the only place that refusal
 * belongs — dropping them silently here would be the under-count this whole
 * file exists to prevent.
 *
 * @param {{ files?: { fileName: string, name?: string, gzipBytes: number }[] }} report
 * @returns {Map<string, { name: string, gzipBytes: number, fileNames: string[] }>}
 */
export function measureChunksByName(report) {
  const byName = new Map();
  for (const file of report?.files ?? []) {
    const name = file?.name;
    if (typeof name !== 'string' || name === '') continue;
    const entry = byName.get(name) ?? { name, gzipBytes: 0, fileNames: [] };
    entry.gzipBytes += file.gzipBytes;
    entry.fileNames.push(file.fileName);
    byName.set(name, entry);
  }
  return byName;
}

/**
 * Weigh each budgeted chunk against its own ceiling.
 *
 * Three verdicts, and the ORDER between them is the design:
 *
 *   - `error` — the report cannot be read, yielded no named chunks at all, or
 *     is missing a chunk this file budgets. All three are verdicts about the
 *     GAUGE. The missing-chunk case is the one worth stating out loud: a budget
 *     whose subject is absent passes trivially, so "absent" must be louder than
 *     "over", not quieter. A collapsed measurement is never under budget.
 *   - `fail` — a budgeted chunk is over its ceiling. Names the chunk and BOTH
 *     numbers, because "over budget" without the measurement is a tick in the
 *     other direction.
 *   - `pass` — every budgeted chunk with its measured size and remaining
 *     headroom, so a reader watching a chunk creep upward sees it coming
 *     instead of learning about it the day the gate turns red.
 *
 * @param {object} input
 * @param {unknown} input.report
 * @param {Record<string, number>} [input.ceilings]
 * @param {string} [input.reportPath]
 * @returns {{ status: 'pass' | 'fail' | 'error', message: string,
 *             chunks: { name: string, gzipBytes: number, ceilingBytes: number,
 *                       headroomBytes: number, fileNames: string[] }[],
 *             missing: string[], over: string[] }}
 */
export function evaluatePerChunkBudgets({
  report,
  ceilings = PER_CHUNK_GZIP_CEILINGS,
  reportPath = DEFAULT_REPORT_PATH,
} = {}) {
  const base = { chunks: [], missing: [], over: [] };
  const budgeted = Object.keys(ceilings);

  if (report === null || report === undefined) {
    return {
      ...base,
      status: 'error',
      message:
        `No eager-closure report at ${reportPath}, so no chunk was weighed. Per-chunk ` +
        `ceilings measure nothing without a build — this is a broken gauge, not ` +
        `${budgeted.length} budgets that all passed.`,
    };
  }

  const problems = validateReport(report);
  if (problems.length > 0) {
    return {
      ...base,
      status: 'error',
      message:
        `Per-chunk budgets cannot be read from ${reportPath}:\n  - ${problems.join('\n  - ')}`,
    };
  }

  // A ceiling map with no entries is the same vacuity as a ceiling whose chunk
  // is missing, one level up: nothing is weighed, so nothing can fail.
  if (budgeted.length === 0) {
    return {
      ...base,
      status: 'error',
      message:
        `No per-chunk ceilings are configured, so this half of the gate weighs nothing. ` +
        `An empty PER_CHUNK_GZIP_CEILINGS is a disabled check, not a passing one — ` +
        `objectui#5490 exists because a budget with no subject is green forever.`,
    };
  }

  const measured = measureChunksByName(report);
  // Defence in depth: {@link validateReport} above already refuses a report with
  // no files or with unnamed ones, so this branch should be unreachable through
  // this function. It stays because the direction it guards is the silent one —
  // if a future report shape ever slips an empty measurement past validation,
  // "zero chunks" must read as a broken gauge, never as an under-budget bundle.
  if (measured.size === 0) {
    return {
      ...base,
      status: 'error',
      message:
        `The eager-closure report at ${reportPath} yielded ZERO named chunks, so every ` +
        `per-chunk budget would pass by measuring nothing. A collapsed measurement is not an ` +
        `under-budget bundle.`,
    };
  }

  const present = [...measured.values()].sort((a, b) => b.gzipBytes - a.gzipBytes);
  const missing = budgeted.filter((name) => !measured.has(name));
  if (missing.length > 0) {
    return {
      ...base,
      missing,
      status: 'error',
      message:
        `Budgeted chunk${missing.length === 1 ? '' : 's'} ${missing.map((n) => `\`${n}\``).join(', ')} ` +
        `${missing.length === 1 ? 'is' : 'are'} ABSENT from the eager closure reported at ` +
        `${reportPath}. That is a FAILURE, not a pass: a ceiling whose chunk does not exist ` +
        `weighs nothing and would be green forever.\n` +
        `Either the chunk left the eager closure — good news that must be RE-PINNED here, not ` +
        `inferred — or an \`advancedChunks\` group in apps/console/vite.config.ts was renamed ` +
        `or removed and PER_CHUNK_GZIP_CEILINGS still names the old spelling.\n` +
        `The ${present.length} chunks the report DOES carry, largest first:\n` +
        present.map((c) => `  ${kb(c.gzipBytes).padStart(9)} KB  ${c.name}`).join('\n'),
    };
  }

  const chunks = budgeted
    .map((name) => {
      const entry = /** @type {{ name: string, gzipBytes: number, fileNames: string[] }} */ (
        measured.get(name)
      );
      const ceilingBytes = ceilings[name];
      return {
        name,
        gzipBytes: entry.gzipBytes,
        ceilingBytes,
        headroomBytes: ceilingBytes - entry.gzipBytes,
        fileNames: entry.fileNames,
      };
    })
    .sort((a, b) => b.gzipBytes - a.gzipBytes);

  const over = chunks.filter((c) => c.gzipBytes > c.ceilingBytes);
  // Measured sizes belong in the verdict either way — a reader should see
  // headroom shrinking, not just the tick that precedes a red gate.
  const table = chunks
    .map(
      (c) =>
        `  ${c.gzipBytes > c.ceilingBytes ? '❌' : '✅'} ${c.name.padEnd(20)} ` +
        `${kb(c.gzipBytes).padStart(9)} KB / ${kb(c.ceilingBytes)} KB ceiling ` +
        `(${c.headroomBytes >= 0 ? `headroom ${kb(c.headroomBytes)}` : `OVER by ${kb(-c.headroomBytes)}`} KB)` +
        `${c.fileNames.length > 1 ? ` [${c.fileNames.length} chunks]` : ''}`,
    )
    .join('\n');

  if (over.length > 0) {
    return {
      ...base,
      chunks,
      over: over.map((c) => c.name),
      status: 'fail',
      message:
        `${over.length} eager chunk${over.length === 1 ? ' is' : 's are'} over ` +
        `${over.length === 1 ? 'its' : 'their'} per-chunk budget:\n${table}\n` +
        `These bytes are inside the aggregate ceiling's headroom, which is exactly why this ` +
        `check exists (objectui#5490): one chunk growing while others shrink is invisible to a ` +
        `single total.\n` +
        `If the growth is intended, raise that chunk's entry in PER_CHUNK_GZIP_CEILINGS in ` +
        `scripts/check-eager-closure-budget.mjs deliberately, move PER_CHUNK_BASELINE with it, ` +
        `and say in the PR what the bytes buy — do not widen it just to get a green check.`,
    };
  }

  return {
    ...base,
    chunks,
    status: 'pass',
    message: `Per-chunk eager budgets (${chunks.length} chunks weighed):\n${table}`,
  };
}

/**
 * Weigh every ceiling against the payload it governs, and refuse a ceiling that
 * has drifted out of range of the regression it exists to catch (objectui#5924).
 *
 * ## The failure this exists for
 *
 * Both other halves answer "is the bundle under its line?". Neither can answer
 * "is that line still close enough to the bundle to mean anything?", and that
 * question has a silent wrong answer: a ceiling far above the payload passes
 * everything, prints a green tick with a large `headroom:` figure beside it, and
 * reads as a healthy bundle. The header records the measurement — the aggregate
 * ceiling was 8.6x the regression size above the live payload, and a +154 KB
 * eager regression went green through it.
 *
 * The invariant was not missing, it was checked in the wrong place: the unit
 * test compared {@link MAX_EAGER_CLOSURE_GZIP_BYTES} with
 * {@link BASELINE}.gzipBytes, two literals frozen in this module, so it was true
 * no matter what the console weighed. This function computes the same quantity
 * from the report the gate just read, so drift reds the moment it opens instead
 * of the day someone re-measures by hand.
 *
 * ## Why `error` and not `fail`
 *
 * `fail` is a verdict about the BUNDLE — it grew past a line. Nothing has grown
 * here; the ceiling has stopped being a measurement of anything. That is a
 * verdict about the GAUGE, which is what exit 2 means in this file, and it is
 * the same asymmetry {@link evaluatePerChunkBudgets} applies to a budgeted chunk
 * that is absent: a check that passes by measuring nothing must be LOUDER than
 * one that fails by measuring something, never quieter.
 *
 * ## Both sides of the range (objectui#8554)
 *
 * A ceiling stops measuring at either end. Too far above the payload and its
 * green tick cannot tell "no regression" from the motivating incident; too close
 * and its green tick is about the next change rather than this one. The upper
 * bound is one whole regression; the lower bound is
 * {@link EXHAUSTED_HEADROOM_FLOOR_MULTIPLE} of one, with the rows that were
 * already under it pinned at their measured headroom in
 * {@link EXHAUSTED_HEADROOM_ALLOWANCES}. Both verdicts are the same kind — about
 * the GAUGE, so `error` and exit 2 — because a ceiling nobody can act on until
 * it fires is not a working ceiling in either direction.
 *
 * ## What it deliberately does not do
 *
 * It does not treat a NEGATIVE headroom — a ceiling under the payload — as its
 * business, at EITHER bound. That is an over-budget bundle, the other two halves
 * own it, and reporting it here as well would turn one regression into an error
 * and teach a reader to distrust the exit code. ⛔ The exhausted leg therefore
 * tests `0 <= headroom < floor` and not `headroom < floor`: the second would
 * swallow every over-budget row into this half and convert a size failure into a
 * gauge error, which is precisely the confusion this paragraph exists to
 * prevent. Over-budget rows are still printed, marked as such, so the table is a
 * complete picture of every ceiling.
 *
 * @param {object} input
 * @param {unknown} input.report
 * @param {number} [input.budgetBytes]      the aggregate ceiling
 * @param {Record<string, number>} [input.ceilings]  the per-chunk ceilings
 * @param {number} [input.regressionBytes]  the size this gate must stay able to catch
 * @param {number} [input.floorMultiple]    the lower bound, as a fraction of that size
 * @param {Record<string, number>} [input.allowances]  declared already-exhausted rows
 * @param {string} [input.reportPath]
 * @returns {{ status: 'pass' | 'error', message: string,
 *             sites: { key: string, label: string, constant: string, measuredBytes: number,
 *                      ceilingBytes: number, headroomBytes: number, multiple: number }[],
 *             blind: string[], exhausted: string[] }}
 */
export function evaluateHeadroomSensitivity({
  report,
  budgetBytes = MAX_EAGER_CLOSURE_GZIP_BYTES,
  ceilings = PER_CHUNK_GZIP_CEILINGS,
  regressionBytes = REGRESSION_THIS_GATE_MUST_CATCH_BYTES,
  floorMultiple = EXHAUSTED_HEADROOM_FLOOR_MULTIPLE,
  allowances = EXHAUSTED_HEADROOM_ALLOWANCES,
  allowanceGrainMultiple = EXHAUSTED_HEADROOM_ALLOWANCE_GRANULARITY_MULTIPLE,
  reportPath = DEFAULT_REPORT_PATH,
} = {}) {
  const base = { sites: [], blind: [], exhausted: [] };

  if (report === null || report === undefined) {
    return {
      ...base,
      status: 'error',
      message:
        `No eager-closure report at ${reportPath}, so no ceiling could be weighed against the ` +
        `payload it governs. Sensitivity is a property of the ceiling AND the measurement — ` +
        `with only one of them there is nothing to check. This is a broken gauge, not a ` +
        `sensitive gate.`,
    };
  }

  const problems = validateReport(report);
  if (problems.length > 0) {
    return {
      ...base,
      status: 'error',
      message: `Ceiling sensitivity cannot be judged from ${reportPath}:\n  - ${problems.join('\n  - ')}`,
    };
  }

  const measured = measureChunksByName(report);
  const sites = [
    {
      key: 'aggregate',
      label: 'aggregate closure',
      constant: 'MAX_EAGER_CLOSURE_GZIP_BYTES',
      measuredBytes: /** @type {{ eagerGzipBytes: number }} */ (report).eagerGzipBytes,
      ceilingBytes: budgetBytes,
    },
  ];
  const absent = [];
  for (const [name, ceilingBytes] of Object.entries(ceilings)) {
    const entry = measured.get(name);
    // A budgeted chunk with nothing to weigh has no headroom to judge. It is
    // already an ERROR one level up, and inventing a verdict for it here (0
    // bytes measured, so "drifted") would be a second wrong reason for the
    // right exit code. Refuse the whole judgement instead of guessing part of it.
    if (entry === undefined) {
      absent.push(name);
      continue;
    }
    sites.push({
      key: name,
      label: `chunk \`${name}\``,
      constant: `PER_CHUNK_GZIP_CEILINGS['${name}']`,
      measuredBytes: entry.gzipBytes,
      ceilingBytes,
    });
  }

  if (absent.length > 0) {
    return {
      ...base,
      status: 'error',
      message:
        `Cannot judge ceiling sensitivity: budgeted chunk${absent.length === 1 ? '' : 's'} ` +
        `${absent.map((n) => `\`${n}\``).join(', ')} ${absent.length === 1 ? 'is' : 'are'} absent ` +
        `from ${reportPath}, so ${absent.length === 1 ? 'its ceiling governs' : 'their ceilings govern'} ` +
        `nothing measurable. See the per-chunk verdict for what to do about it.`,
    };
  }

  const rows = sites.map((site) => {
    const headroomBytes = site.ceilingBytes - site.measuredBytes;
    return { ...site, headroomBytes, multiple: headroomBytes / regressionBytes };
  });
  const blind = rows.filter((row) => row.headroomBytes >= regressionBytes);
  const floorBytes = regressionBytes * floorMultiple;
  const allowanceGrainBytes = regressionBytes * allowanceGrainMultiple;
  // The headroom this row must keep: the floor, unless it is one of the rows
  // that was already under the floor when the floor was written, in which case
  // it is that row's own pinned figure — less one grain, because a ratchet that
  // fires on drift the table cannot render is a red with no readable evidence.
  // See EXHAUSTED_HEADROOM_ALLOWANCE_GRANULARITY_MULTIPLE.
  const floorFor = (row) =>
    allowances[row.key] === undefined ? floorBytes : allowances[row.key] - allowanceGrainBytes;
  // ⛔ `headroomBytes >= 0` is load-bearing, not defensive. Without it every
  // OVER-budget row falls under the floor too, and this half would convert the
  // size verdict's exit 1 into a gauge error — see "What it deliberately does
  // not do" above.
  const exhausted = rows.filter(
    (row) => row.headroomBytes >= 0 && row.headroomBytes < floorFor(row),
  );

  const table = rows
    .map((row) => {
      const allowance = allowances[row.key];
      const band =
        row.headroomBytes < 0
          ? `OVER by ${kb(-row.headroomBytes)} KB — the size verdict owns this row, not this one`
          : `headroom ${kb(row.headroomBytes)} KB = ${row.multiple.toFixed(2)}x the ` +
            `${kb(regressionBytes)} KB regression` +
            // Printed on a PASSING row too: a declared exhausted ceiling that
            // only appears when it fires is the silence this leg exists to end.
            (allowance === undefined
              ? ''
              : `, under the ${floorMultiple.toFixed(2)}x floor and held open by its ` +
                `declared ${allowance}-byte allowance, which may only be paid DOWN; ` +
                `reds below ${Math.round(allowance - allowanceGrainBytes)} bytes`);
      const failing = row.headroomBytes >= regressionBytes || exhausted.includes(row);
      return (
        `  ${failing ? '❌' : '✅'} ${row.label.padEnd(28)} ` +
        `${kb(row.measuredBytes).padStart(9)} KB measured / ${kb(row.ceilingBytes)} KB ceiling ` +
        `(${band})  [${row.constant}]`
      );
    })
    .join('\n');

  const headlines = [];
  const prose = [];

  if (blind.length > 0) {
    headlines.push(
      `${blind.length} ceiling${blind.length === 1 ? '' : 's'} ` +
        `${blind.length === 1 ? 'has' : 'have'} DRIFTED more than one ` +
        `${kb(regressionBytes)} KB regression above the payload ` +
        `${blind.length === 1 ? 'it governs' : 'they govern'}:`,
    );
    prose.push(
      `A ceiling that far above today's measurement cannot tell "no regression" from a repeat ` +
        `of objectui#5266 — its green tick carries no information, which makes this a verdict ` +
        `about the GAUGE and not about the bundle (objectui#5924: an aggregate ceiling at 8.6x ` +
        `passed a demonstrated +154 KB eager regression).\n` +
        `The payload almost certainly SHRANK, which is good news — and good news is RE-PINNED ` +
        `deliberately, never inferred: lower the named constant, move its baseline with it in ` +
        `the same commit, and say in the PR what the new headroom is.\n` +
        `⛔ Never lower a ceiling BELOW the measured figure to express an aspiration. A ceiling ` +
        `under today's reality lands red on \`main\`, which is how a budget gets switched off ` +
        `rather than met.`,
    );
  }

  // Two populations, two remedies. A row falling under the floor for the first
  // time is somebody's to fix; a DECLARED row getting tighter is a standing debt
  // whose payoff is a decision this run's author very likely does not own. Giving
  // both the same "find the bytes" text is what sends an innocent author to audit
  // a diff that is not the cause — the misattribution objectui#8554 documents.
  const newlyExhausted = exhausted.filter((row) => allowances[row.key] === undefined);
  const declaredTightened = exhausted.filter((row) => allowances[row.key] !== undefined);

  if (exhausted.length > 0) {
    headlines.push(
      `${exhausted.length} ceiling${exhausted.length === 1 ? ' is' : 's are'} EXHAUSTED — under ` +
        `${floorMultiple.toFixed(2)}x of one ${kb(regressionBytes)} KB regression, or a declared ` +
        `row that has tightened by a whole ${allowanceGrainMultiple.toFixed(2)}x:`,
    );
  }

  if (newlyExhausted.length > 0) {
    prose.push(
      `A ceiling with no headroom left has stopped being a measurement of THIS bundle and become ` +
        `a measurement of the NEXT change: it passes today and reds whatever lands next, whether ` +
        `or not that diff is what grew. This gate has already been paid for twice ` +
        `(objectui#8554): \`framework\` sat at one byte across two merges and printed a green ` +
        `row throughout, and \`i18n-locales\` sat at 398 bytes while the merge queue weighed two ` +
        `independent finished pull requests and turned red on whichever it happened to weigh ` +
        `SECOND, for the other one's bytes.\n` +
        `The remedy is the bytes: take them out of the chunk this row names, or take a ` +
        `deliberate, authorised re-pin and say in the PR what the new headroom buys.\n` +
        `⛔ Never raise a ceiling because this leg noticed it is full — that is how a budget gets ` +
        `switched off rather than met, the same rule the blind-side verdict states in the other ` +
        `direction. ⛔ Never lower EXHAUSTED_HEADROOM_FLOOR_MULTIPLE, and ⛔ never add a row to ` +
        `EXHAUSTED_HEADROOM_ALLOWANCES to silence this: that object records debt measured on the ` +
        `day the floor landed and may only be paid down.`,
    );
  }

  if (declaredTightened.length > 0) {
    prose.push(
      `${declaredTightened.map((row) => row.label).join(', ')} ` +
        `${declaredTightened.length === 1 ? 'was' : 'were'} ALREADY declared exhausted before ` +
        `this run, and ${declaredTightened.length === 1 ? 'has' : 'have'} now lost a further ` +
        `${allowanceGrainMultiple.toFixed(2)}x of a regression against the pinned figure.\n` +
        `⚠️ READ THIS BEFORE AUDITING YOUR OWN DIFF. This row's headroom is a standing debt that ` +
        `predates this change, and it moves under traffic that has nothing to do with the chunk ` +
        `— measured at three gzipped bytes across five unrelated merges. So this verdict is NOT ` +
        `an accusation that your diff spent the bytes, and the amount it names is very likely ` +
        `not yours. What it asserts is only that the row is tighter than the day it was pinned.\n` +
        `⛔ There is therefore nothing here for this pull request to "fix", and the two edits that ` +
        `would turn this green are both forbidden: ⛔ never raise the ceiling, and ⛔ never raise ` +
        `the allowance. Paying the row down is the open decision on the chunk, ⛔ not a task for ` +
        `whichever change the queue happened to weigh — take it there, and say on this pull ` +
        `request that you did.`,
    );
  }

  if (headlines.length > 0) {
    return {
      sites: rows,
      blind: blind.map((row) => row.key),
      exhausted: exhausted.map((row) => row.key),
      status: 'error',
      // One table, however many verdicts named it: a reader comparing two
      // renderings of the same five rows is reading for differences that are
      // not there.
      message: `${headlines.join('\n')}\n${table}\n${prose.join('\n')}`,
    };
  }

  return {
    sites: rows,
    blind: [],
    exhausted: [],
    status: 'pass',
    message:
      `Ceiling sensitivity (${rows.length} ceilings, each weighed against the report just read):\n` +
      `${table}`,
  };
}

/**
 * The constants a verdict from this file is COMPUTED FROM — the three the three
 * evaluators above take as their defaults, and no others.
 *
 * {@link BASELINE} and {@link PER_CHUNK_BASELINE} are deliberately absent. They
 * record the measurements the ceilings were derived from and are read by the
 * unit test and by a human; no verdict depends on them. Listing them here would
 * make a baseline-only or comment-only edit on the base branch read as a
 * superseded ceiling, and a freshness check that cries wolf is one people learn
 * to click past.
 */
export const VERDICT_CEILING_CONSTANTS = Object.freeze([
  'MAX_EAGER_CLOSURE_GZIP_BYTES',
  'PER_CHUNK_GZIP_CEILINGS',
  'REGRESSION_THIS_GATE_MUST_CATCH_BYTES',
]);

/**
 * Read one `export const NAME = ...;` initializer out of module SOURCE TEXT,
 * with comments dropped and formatting normalised.
 *
 * Text, not values, because the two sides of the freshness comparison are this
 * file at two different commits and only one of them can be imported: the other
 * is a blob from the base branch. Comparing `89 * 1024` against `91136` would
 * be comparing an expression with an evaluation, so both sides are read the
 * same way — through this function — and a difference means a difference.
 *
 * What normalisation deliberately erases, because none of it moves a ceiling:
 * comments, line breaks and indentation, trailing commas, and the `_` numeric
 * separators (`3_345_000` and `3345000` are the same number). What it keeps is
 * everything else, so a changed digit is a changed ceiling.
 *
 * @param {string} source
 * @param {number} from index just past the `=`
 * @returns {string | null} the normalised initializer, or null if unterminated
 */
function readInitializer(source, from) {
  let depth = 0;
  const out = [];
  let i = from;
  while (i < source.length) {
    const ch = source[i];
    const pair = source.slice(i, i + 2);
    if (pair === '//') {
      while (i < source.length && source[i] !== '\n') i += 1;
      out.push(' ');
      continue;
    }
    if (pair === '/*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) return null;
      i = end + 2;
      out.push(' ');
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const literal = readStringLiteral(source, i);
      if (literal === null) return null;
      out.push(literal.text);
      i = literal.end;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    if (ch === ';' && depth === 0) return normaliseDeclaration(out.join(''));
    out.push(ch);
    i += 1;
  }
  return null;
}

/** @param {string} source @param {number} start index of the opening quote */
function readStringLiteral(source, start) {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote) return { text: source.slice(start, i + 1), end: i + 1 };
    i += 1;
  }
  return null;
}

/** @param {string} text */
function normaliseDeclaration(text) {
  return text
    .replace(/(\d)_(?=\d)/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/,(\s*[}\])])/g, '$1')
    .trim();
}

/**
 * Pull the {@link VERDICT_CEILING_CONSTANTS} declarations out of module source.
 *
 * A name this cannot find goes in `missing` and is an ERROR upstream, never a
 * skipped comparison: "I could not read the ceiling" and "the ceiling agrees"
 * are the two answers a freshness check must never confuse, and only one of
 * them is safe to be quiet about.
 *
 * @param {string | null | undefined} source
 * @param {readonly string[]} [names]
 * @returns {{ declarations: Map<string, string>, missing: string[] }}
 */
export function extractCeilingDeclarations(source, names = VERDICT_CEILING_CONSTANTS) {
  const declarations = new Map();
  const missing = [];
  const text = typeof source === 'string' ? source : '';
  for (const name of names) {
    const anchor = new RegExp(`^export const ${name}\\s*=`, 'm').exec(text);
    const initializer = anchor === null ? null : readInitializer(text, anchor.index + anchor[0].length);
    if (initializer === null || initializer === '') {
      missing.push(name);
      continue;
    }
    declarations.set(name, initializer);
  }
  return { declarations, missing };
}

/**
 * The FOURTH half: is the ceiling this run weighed against still the ceiling in
 * force on the base branch? (objectui#6245)
 *
 * ## The race
 *
 * `Bundle Analysis` is a required context, and a `pull_request` run checks out
 * the MERGE REF — a merge of the PR head with the base branch as GitHub last
 * computed it. GitHub does not re-run a PR's checks when the base branch moves,
 * so a green verdict can be computed against ceiling constants that `main` has
 * since replaced, and the merge is then gated on a verdict about a ceiling that
 * no longer exists.
 *
 * Observed live rather than reasoned about: run 32804357171 started at
 * 03:13:27Z, six minutes and fifty seconds after `0409b766d` lowered
 * {@link MAX_EAGER_CLOSURE_GZIP_BYTES} from 4,086,000 to 3,345,000 on `main`,
 * and published `BUDGET_CLOSURE_BUDGET_KB: 3990.2` — 4,086,000 bytes, the
 * retired ceiling — with `conclusion: success`. It did not bite: the payload was
 * 3222.6 KB, under both numbers. What bounds how much the NEXT one could hide is
 * the aggregate headroom in force, which `pnpm check:eager-closure` prints and
 * this comment deliberately does not restate: the figure that stood here was two
 * re-baselines out of date (objectui#7518).
 *
 * ## Why THREE readings and not two
 *
 * Comparing this checkout's ceilings against the base branch's is not enough: a
 * re-baseline PR differs from the base branch ON PURPOSE, and failing it would
 * make the one PR that must land unlandable. So the question is not "do they
 * differ" but "did the BASE BRANCH move them out from under this checkout":
 *
 *   - `prBaseSource` — the checker at the base commit this checkout was
 *     computed from. What the base branch said when the merge ref was made.
 *   - `baseSource` — the checker at the base branch tip right now. What the
 *     merge would actually land on.
 *   - `headSource` — the checker in this checkout. What the verdict used.
 *
 * A ceiling is SUPERSEDED when it moved between the first two AND this checkout
 * does not carry the move. A re-baseline PR moves it in `headSource` only, the
 * first two agree, and nothing fires.
 *
 * ## Why `error` (exit 2) and not `fail`
 *
 * `fail` is a verdict about the BUNDLE — it grew past a line. Nothing has grown
 * here and no ceiling has drifted; the measurement above is sound and the
 * ceilings on the base branch are sound. What is wrong is that they were never
 * weighed against each other. That is a verdict about the GAUGE, which is what
 * exit 2 means in this file, and the message says so in as many words — a
 * freshness failure that reads like "the bundle grew" would send its reader
 * hunting a regression that is not there.
 *
 * ## What this closes, and what it does not
 *
 * It closes the window this card recorded: a run that EXECUTES after the
 * constants move, with a checkout that predates it. It cannot close the window
 * where the run finishes BEFORE the constants move and the PR is merged after —
 * no code of ours runs at that moment. That residual is what the `push`-on-main
 * run detects after the fact, and closing it needs "require branches to be up to
 * date before merging", a repository setting and a maintainer-floor decision
 * this file has no business making.
 *
 * @param {object} input
 * @param {string} [input.eventName]     `GITHUB_EVENT_NAME`
 * @param {string | null} [input.headSource]     this checkout's copy of this file
 * @param {string | null} [input.prBaseSource]   this file at the checkout's base commit
 * @param {string | null} [input.baseSource]     this file at the base branch tip
 * @param {string} [input.prBaseSha]
 * @param {string} [input.baseSha]
 * @param {string} [input.baseRef]
 * @returns {{ status: 'pass' | 'error' | 'not-applicable', message: string,
 *             moved: string[], superseded: string[] }}
 */
export function evaluateCeilingFreshness({
  eventName,
  headSource,
  prBaseSource,
  baseSource,
  prBaseSha,
  baseSha,
  baseRef,
} = {}) {
  const base = { moved: [], superseded: [] };
  const branch = baseRef ? `\`${baseRef}\`` : 'the base branch';

  // A `push` run's checkout IS the branch being weighed, and a local run has no
  // merge to gate. Neither can hold a superseded ceiling, so neither gets a
  // verdict — this half exists for the merge ref and nothing else.
  if (eventName !== 'pull_request') {
    return {
      ...base,
      status: 'not-applicable',
      message:
        `Ceiling freshness: not applicable to a ${eventName ? `\`${eventName}\`` : 'local'} run. ` +
        `This check compares a pull_request merge ref against the branch it would land on; a ` +
        `checkout that IS that branch cannot be behind it.`,
    };
  }

  const absent = [
    prBaseSource ? null : 'EAGER_CLOSURE_PR_BASE_SOURCE',
    baseSource ? null : 'EAGER_CLOSURE_BASE_SOURCE',
  ].filter((name) => name !== null);
  if (absent.length > 0) {
    return {
      ...base,
      status: 'error',
      message:
        `Ceiling freshness cannot be judged on this pull_request run: ${absent.join(' and ')} ` +
        `named no readable file.\n` +
        `Those are exported by the \`Resolve the base-branch ceiling constants\` step in ` +
        `.github/workflows/performance-budget.yml; on a pull_request run their absence means ` +
        `that step did not complete, NOT that the ceilings agree.\n` +
        `An unreadable base branch is an ERROR and never a quiet pass: from inside this ` +
        `checkout a superseded ceiling looks exactly like a current one.`,
    };
  }

  const sides = /** @type {[string, string | null | undefined][]} */ ([
    ['this checkout', headSource],
    ['the base commit this checkout was made from', prBaseSource],
    [`the ${baseRef ? `\`${baseRef}\`` : 'base branch'} tip`, baseSource],
  ]);
  const read = sides.map(([label, source]) => ({ label, ...extractCeilingDeclarations(source) }));
  const unreadable = read.filter((side) => side.missing.length > 0);
  if (unreadable.length > 0) {
    return {
      ...base,
      status: 'error',
      message:
        `Ceiling freshness cannot be judged — the ceiling declarations could not be located:\n` +
        unreadable
          .map((side) => `  - in ${side.label}: ${side.missing.map((n) => `\`${n}\``).join(', ')}`)
          .join('\n') +
        `\nBoth sides are read by \`extractCeilingDeclarations\`, which looks for ` +
        `\`export const NAME = ... ;\` at the top level of this file. A name it cannot find has ` +
        `been renamed, moved, or reshaped — re-point VERDICT_CEILING_CONSTANTS at the ceilings ` +
        `the verdict is now computed from. It is an error rather than a skipped comparison for ` +
        `the same reason an absent budgeted chunk is: a check that weighs nothing passes forever.`,
    };
  }

  const [head, prBase, current] = read.map((side) => side.declarations);
  const moved = [...VERDICT_CEILING_CONSTANTS].filter(
    (name) => prBase.get(name) !== current.get(name),
  );
  const superseded = moved.filter((name) => head.get(name) !== current.get(name));

  if (superseded.length === 0) {
    return {
      ...base,
      moved,
      status: 'pass',
      message:
        moved.length === 0
          ? `Ceiling freshness: all ${VERDICT_CEILING_CONSTANTS.length} ceiling constants are ` +
            `unchanged on ${branch} since this checkout's base${baseSha ? ` (${baseSha})` : ''}, ` +
            `so the verdicts above were weighed against the ceilings actually in force.`
          : `Ceiling freshness: ${moved.map((n) => `\`${n}\``).join(', ')} moved on ${branch} ` +
            `since this checkout's base, and this checkout already carries the new ` +
            `value${moved.length === 1 ? '' : 's'} — the verdicts above are current.`,
    };
  }

  const table = superseded
    .map(
      (name) =>
        `  ❌ ${name}\n` +
        `       weighed here : ${head.get(name)}\n` +
        `       in force now : ${current.get(name)}`,
    )
    .join('\n');

  return {
    moved,
    superseded,
    status: 'error',
    message:
      `${superseded.length} ceiling constant${superseded.length === 1 ? '' : 's'} this run ` +
      `weighed against ${superseded.length === 1 ? 'has' : 'have'} been SUPERSEDED: ${branch} ` +
      `moved ${superseded.length === 1 ? 'it' : 'them'} after this checkout was made` +
      `${prBaseSha && baseSha ? ` (${prBaseSha} -> ${baseSha})` : ''}, and nothing re-ran the ` +
      `verdicts above.\n${table}\n` +
      `⛔ NOTHING GREW. This is not a size regression and it is not a drifted ceiling: the ` +
      `measurement above is sound, and so are the ceilings on ${branch}. The only thing wrong is ` +
      `that they were never weighed against each other, so a green tick here would gate the ` +
      `merge on a ceiling that no longer exists (objectui#6245).\n` +
      `Fix: update this branch onto ${branch} — merge or rebase — and let Bundle Analysis run ` +
      `again. ⛔ Do NOT widen a ceiling to clear this; re-baselining is a separate, deliberate ` +
      `act and this run has no evidence for one.`,
  };
}

/**
 * The biggest eager chunks, so a failure names suspects instead of a total.
 * @param {{ files?: { fileName: string, gzipBytes: number }[] }} report
 * @param {number} [limit]
 */
export function renderTopChunks(report, limit = 12) {
  const files = [...(report?.files ?? [])].sort((a, b) => b.gzipBytes - a.gzipBytes).slice(0, limit);
  return files.map((f) => `  ${kb(f.gzipBytes).padStart(9)} KB  ${f.fileName}`).join('\n');
}

/**
 * Read a source file for {@link evaluateCeilingFreshness}, or null when the
 * path is absent or unreadable. Null is never "the same as" — it routes to a
 * loud ERROR upstream.
 * @param {string | undefined} sourcePath
 */
export function readSource(sourcePath) {
  if (!sourcePath) return null;
  try {
    return fs.readFileSync(sourcePath, 'utf8');
  } catch {
    return null;
  }
}

/** @param {string} reportPath */
export function readReport(reportPath) {
  try {
    return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Every status the four halves are declared to produce, and the only ones
 * {@link foldHalfStatuses} knows how to weigh.
 *
 * DERIVED, not invented: it is the union of the four `@returns` unions above —
 * {@link evaluateClosureBudget} and {@link evaluatePerChunkBudgets}
 * (`pass | fail | error`), {@link evaluateHeadroomSensitivity}
 * (`pass | error`), and {@link evaluateCeilingFreshness}
 * (`pass | error | not-applicable`). `scripts/__tests__/` re-derives that union
 * from this file's own text and reds when the two disagree, so a half that
 * gains a FIFTH status cannot gain it without also being given a code here.
 * That test is the reason this list may be written down at all (AGENTS.md #9):
 * an instrument re-derives it.
 */
export const RECOGNISED_HALF_STATUSES = Object.freeze([
  'pass',
  'fail',
  'error',
  'not-applicable',
]);

/**
 * Folds the halves' verdicts into one exit code, and names every half whose
 * status this file does not recognise.
 *
 * objectui#9006 — the fold this replaces enumerated only the statuses that
 * FAIL (`includes('error')`, then `includes('fail')`) and returned `0` for
 * everything else. `pass` and `not-applicable` were meant to land there; a
 * status NOBODY enumerated landed there too, while the printer above — which
 * asks a different question, `status === 'pass'` — rendered that same value as
 * ❌. A run could print a red cross and exit 0.
 *
 * ⛔ The repair is a DISTINCTION, not a tightening. Nothing that exists today
 * moves: `pass` → 0, `fail` → 1, `error` → 2, and `not-applicable` stays
 * exactly as INERT as the paragraph below says it must be — it is the absence
 * of a question, not the answer `pass`, and it still contributes nothing.
 * Only the unrecognised class changes, from silence to 2.
 *
 * WHY 2, AND WHY NOT A `throw`. Both were on the table (objectui#9006 lists
 * four candidate shapes); the measurement that decides between them is what
 * Node does with an uncaught exception:
 *
 *   - An uncaught `throw` exits Node with **1** — this file's "over budget"
 *     code. A gauge that produced nothing would then be reported as a size
 *     regression, which is the exact collapse the paragraph below refuses. A
 *     `throw` is not louder; in the only unit a workflow reads, it is
 *     MIS-LABELLED. It would also break `main`'s contract of RETURNING a code,
 *     which both this file's entrypoint (`process.exit(main())`) and every
 *     caller in the test file depend on.
 *   - `2` is this file's own "no trustworthy verdict" code, and an
 *     unrecognised status is precisely a check that measured nothing. The rule
 *     stated below — a check that passes by measuring nothing must be LOUDER
 *     than one that fails by measuring something, never quieter — is satisfied
 *     by the ordering that already exists, rather than by inventing a rank
 *     outside it.
 *
 * @param {Record<string, string>} halves  half name -> the status it declared
 * @returns {{ code: number, unrecognised: { half: string, status: string }[] }}
 *          `code` is 0, 1 or 2; `unrecognised` is empty on every run whose
 *          halves all declared a recognised status.
 */
export function foldHalfStatuses(halves) {
  const entries = Object.entries(halves);
  const unrecognised = entries
    .filter(([, status]) => !RECOGNISED_HALF_STATUSES.includes(status))
    .map(([half, status]) => ({ half, status }));

  // Ahead of the `error` test on purpose. Both return 2, so the ORDER cannot
  // change an exit code — what it changes is whether the caller is told. A
  // sibling half erroring in the same run must not be allowed to absorb the
  // one signal that a status nobody enumerated exists at all.
  if (unrecognised.length > 0) return { code: 2, unrecognised };

  const statuses = entries.map(([, status]) => status);
  if (statuses.includes('error')) return { code: 2, unrecognised };
  return { code: statuses.includes('fail') ? 1 : 0, unrecognised };
}

/** Appends `name=value` lines to $GITHUB_OUTPUT when running in Actions. */
function writeGithubOutput(entries, outputPath = process.env.GITHUB_OUTPUT) {
  if (!outputPath) return;
  const lines = Object.entries(entries).map(([k, v]) => `${k}=${v}\n`);
  fs.appendFileSync(outputPath, lines.join(''));
}

/**
 * Exit codes: `0` within budget, `1` over budget — the aggregate ceiling or any
 * per-chunk ceiling — and `2` no trustworthy verdict (report missing,
 * stale-shaped, internally inconsistent, missing a budgeted chunk, governed by
 * a ceiling that has drifted out of range of the regression it must catch,
 * governed by a ceiling with no headroom left to measure with — objectui#8554,
 * the same verdict at the other end of the same range — or — objectui#6245 —
 * weighed against a ceiling the base branch has since replaced).
 *
 * The last of those is the one exit 2 case with a PERFECTLY GOOD measurement
 * behind it, so nothing downstream may word exit 2 as "nothing was measured".
 *
 * `2` covers the unbuilt tree, and deliberately so: with no
 * `apps/console/dist/eager-closure.json` this check reports a BROKEN GAUGE and
 * the workflow fails the step. It never prints a verdict about a bundle nobody
 * weighed, and it never exits 0 having measured nothing.
 *
 * All FOUR halves are evaluated and printed before any of them decides the
 * code: a run that reports the total and hides which chunk moved (or hides
 * whether either line still means anything, or whether the line it used is the
 * line in force) teaches readers to ignore the half they cannot see.
 */
export function main(argv = process.argv.slice(2), env = process.env) {
  const flagIndex = argv.indexOf('--report');
  const reportPath = flagIndex === -1 ? DEFAULT_REPORT_PATH : argv[flagIndex + 1];
  const resolved = path.resolve(reportPath);
  const report = readReport(resolved);
  const result = evaluateClosureBudget({ report, reportPath });
  const perChunk = evaluatePerChunkBudgets({ report, reportPath });
  const sensitivity = evaluateHeadroomSensitivity({ report, reportPath });
  // The fourth half asks about the CEILING rather than the payload, so its
  // inputs are source texts and not the report: this file as checked out,
  // and this file at two commits on the base branch. See
  // {@link evaluateCeilingFreshness}.
  const freshness = evaluateCeilingFreshness({
    eventName: env.GITHUB_EVENT_NAME,
    headSource: readSource(fileURLToPath(import.meta.url)),
    prBaseSource: readSource(env.EAGER_CLOSURE_PR_BASE_SOURCE),
    baseSource: readSource(env.EAGER_CLOSURE_BASE_SOURCE),
    prBaseSha: env.EAGER_CLOSURE_PR_BASE_SHA,
    baseSha: env.EAGER_CLOSURE_BASE_SHA,
    baseRef: env.EAGER_CLOSURE_BASE_REF,
  });

  if (result.status === 'pass') {
    console.log(`✅ ${result.message}`);
  } else {
    console.error(`❌ ${result.message}`);
  }
  if (perChunk.status === 'pass') {
    console.log(`✅ ${perChunk.message}`);
  } else {
    console.error(`❌ ${perChunk.message}`);
  }
  if (sensitivity.status === 'pass') {
    console.log(`✅ ${sensitivity.message}`);
  } else {
    console.error(`❌ ${sensitivity.message}`);
  }
  // `not-applicable` is printed rather than skipped. A half that says nothing
  // is indistinguishable from a half that was switched off, and this file's
  // whole argument is that silence must never read as a pass.
  if (freshness.status === 'pass') {
    console.log(`✅ ${freshness.message}`);
  } else if (freshness.status === 'not-applicable') {
    console.log(`ℹ️  ${freshness.message}`);
  } else {
    console.error(`❌ ${freshness.message}`);
  }
  if (report?.files?.length) {
    console.log('');
    console.log('Largest eagerly loaded chunks (gzipped):');
    console.log(renderTopChunks(report));
  }

  writeGithubOutput({
    closure_status: result.status,
    closure_gzip_kb: result.gzipBytes === null ? '' : kb(result.gzipBytes),
    closure_budget_kb: kb(result.budgetBytes),
    closure_chunks: result.chunkCount === null ? '' : String(result.chunkCount),
    closure_chunk_status: perChunk.status,
    closure_headroom_status: sensitivity.status,
    // Empty on a run this half does not apply to, so the PR comment's half
    // table filters it out instead of rendering a blank verdict as a row.
    closure_freshness_status: freshness.status === 'not-applicable' ? '' : freshness.status,
    // `env`, not `process.env`: every other input this function reads comes from
    // the injected environment, and a default that reaches around it would make
    // the outputs untestable through the same seam as the verdicts.
  }, env.GITHUB_OUTPUT);

  // Distinct codes so the workflow can tell "over budget" (a real verdict about
  // the bundle) from "the gauge produced nothing" (a verdict about the gauge).
  // Collapsing them to 1 would let a broken report be reported as a size
  // regression, and a size regression reported as a broken report — each of
  // which teaches readers to ignore the other.
  //
  // `error` outranks `fail` across ALL FOUR halves for the same reason it does
  // within one: a report that cannot be trusted — or a ceiling that no longer
  // measures the thing it names, or that is no longer the ceiling in force —
  // makes its own size verdict meaningless, whichever half noticed first.
  // objectui#5490 established that ordering over two halves; objectui#5924
  // added the third and objectui#6245 the fourth, each under the same rule
  // rather than taking a code of its own. `not-applicable` is inert in the
  // fold: it is the absence of a question, not the answer `pass`.
  //
  // objectui#9006 — the fold itself lives in {@link foldHalfStatuses}, which
  // recognises those four statuses BY NAME and refuses to weigh any other. The
  // halves are passed as a NAMED map rather than an array so the refusal can
  // say which half produced the status nobody enumerated.
  const { code, unrecognised } = foldHalfStatuses({
    closure: result.status,
    'per-chunk': perChunk.status,
    sensitivity: sensitivity.status,
    freshness: freshness.status,
  });
  for (const { half, status } of unrecognised) {
    // A ❌, matching what the printer above already rendered for this value:
    // the two predicates now agree, which is the whole of objectui#9006.
    console.error(
      `❌ The \`${half}\` half declared an UNRECOGNISED status ${JSON.stringify(status)}, ` +
        `so this run has no verdict to give and exits 2 rather than 0.\n` +
        `Recognised statuses are ` +
        `${RECOGNISED_HALF_STATUSES.map((s) => `\`${s}\``).join(', ')}. A half that gained a ` +
        `fifth one must be given a code in RECOGNISED_HALF_STATUSES and in foldHalfStatuses — ` +
        `until it is, this gate refuses to read its silence as a pass.`,
    );
  }
  return code;
}

if (isEntrypoint(import.meta.url)) {
  process.exit(main());
}
