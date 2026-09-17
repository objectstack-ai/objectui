---
'@object-ui/components': minor
---

**`buttonVariant` becomes authorable on `toast` and `sonner`.** Both registrations now
declare it in their registry `inputs`, as `type: 'enum'` over exactly the six values the
TS type and the zod mirror already carry (`default`, `secondary`, `destructive`, `outline`,
`ghost`, `link`). Nothing on the render path changes — both renderers were already passing
`schema.buttonVariant` into `<Button variant={…}>` (objectui#7316).

**What was wrong.** The key was real end to end and invisible anyway: declared on the TS
type for both nodes, read by both renderers, and absent from both `inputs` arrays. `inputs`
is what every consumer of the authoring face reads — the designer property panel, the
palette, and the JSX-page compiler's prop whitelist — so the one surface an author can
discover a key through did not have it. Measured on the branch point: a tree-wide search for
a `buttonVariant` entry in any `inputs` array returned zero, against a lit control that
found both nodes' `inputs` arrays and both nodes' `buttonLabel` entries in the same pass.

**The concrete authoring cost this removes.** `sdui-parser`'s `validateTree` reports any
prop absent from `inputs` as `unknown-prop`, so a page authoring `buttonVariant` was warned
about a key the renderer then honoured — the same failure objectui#3808 named for
`element:text_input.defaultValue`. That warning is gone.

⚠️ **NEW REFUSAL, stated as such.** An `enum` arm is the one arm `validateTree` judges
exactly, and it answers at `error` severity. So on the html/jsx page tier, where an
`error`-severity diagnostic fails the whole page render, a `<toast>` or `<sonner>` node
authoring a `buttonVariant` outside the six now fails its page instead of rendering. That is
deliberate and it is the whole point of the closed list: `cva` contributes no variant class
for a value it does not recognise, so `buttonVariant: 'primary'` used to draw a button with
no background and no text colour, and `buttonVariant: ''` used to resolve silently to the
default look. An `enum` arm converts both into a named refusal an author can act on; a
`string` arm would have left both writable in silence. The sibling `variant` key on these
same two nodes has been `type: 'enum'` all along, so the severity is the one already in
force next door rather than a new posture for these blocks.

**Blast radius, measured rather than assumed.** Every `buttonVariant` value authored
anywhere in this repository is `destructive` or `outline`, both inside the declared six; the
only other occurrences of an out-of-set value are prose in docblocks and changesets
describing the trap.

**Not in scope, named so it is not read as settled.** The opposite direction — dropping
`buttonVariant` from the TS type and the renderers as a non-authorable prop — is a
behaviour change and needs its own ruling; objectui#4631 is the three-surface meta-card and
objectui#7268 the tooltip sibling. Neither is touched here.
