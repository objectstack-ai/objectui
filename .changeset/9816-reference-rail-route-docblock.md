---
"@object-ui/plugin-detail": patch
---

**`buildDefaultPageSchema`'s `showReferenceRail` docblock named a route ADR-0085 removed** (objectui#9816).

The docblock told authors to switch the Reference Rail on "per object via `detail.showReferenceRail`". Nothing performs that read: this package's own CHANGELOG records the objectDef `detail.*` block — `showReferenceRail`, `hideReferenceRail` and `hideRelatedTab` among them — as no longer consulted. An author who followed the sentence declared a key that does nothing, with no warning, no degradation and no rail.

The parenthetical now names the live route only — the option on the synth call — and says what a per-page rail is instead: an authored `record:reference_rail` node in an assigned Page schema. The rest of the docblock is untouched and still true: the rail is OFF by default, it fans out a collection query per related list, and it emits only when `related` has at least 2 entries.

**No executable code changed.** The correction is published all the same: declaration emit carries the docblock onto `BuildPageOptions.showReferenceRail`, so this is the text an editor tooltip shows for the option.

It is the third correction of the same claim — two README statements about this flag went with objectui#7998 — so it arrives with a pin rather than on its own. `packages/plugin-detail/src/__tests__/referenceRailRoute-9816.test.ts` reddens if a `detail.`-scoped rail key reappears anywhere in this package (comments included — a comment is the carrier that bit all three times), and separately if `options.showReferenceRail` stops being a read in code rather than a sentence about one.
