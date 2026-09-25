---
'@object-ui/plugin-detail': patch
'@object-ui/types': patch
---

`record:path` and `record:quick_actions` no longer read the contract-refused
`aria.label` spelling as an accessible name. A document that still carries it
is reported instead (objectui#9945).

## What changes for a stored document

`@objectstack/spec`'s shared ARIA shape refuses `aria.label` on parse. It is the
alias entry that points at `aria.ariaLabel`, so nothing newly authored can carry
it. Two blocks read it anyway, as back-compat for documents written before the
contract closed: `record:path`, which read it and nothing else before
objectui#9556, and `record:quick_actions`, where objectui#4663 put it behind
`aria.ariaLabel`. The maintainer ruled that fold retired (ruling `5749677059`,
letter A), under the standing rule that a deprecated alias retires at once
unless a named external user needs a staged window.

So on those two blocks:

- `aria: { label: 'Deal stages' }` is **not read**. `record:path`'s rails
  announce their localized default name (the `detail.pathLabel` pack entry,
  "Record path" in English), and `record:quick_actions`' toolbar announces its
  built-in "Quick actions".
- A served `aria.label` gets **one `console.warn`** when the block mounts. It
  names the block and the canonical spelling `aria.ariaLabel`. It fires from an
  effect, so re-renders do not repeat it. This is the channel the package
  already uses when the spec refuses a declaration and the block ignores it
  (the row-cap refusal).
- `aria.ariaLabel` is unchanged. It still names the block, including when a
  document carries both spellings (the warning still fires for the refused one).

**Migration:** rename `aria.label` to `aria.ariaLabel` on those two blocks.

## What does not change

- The other `record:*` blocks that read the `aria` bag never read `aria.label`
  in a release, and still do not. They do not report it either.
- No published symbol is added or removed. In `@object-ui/types`, only the
  docblock on `RecordComponentAriaProps` that described the fold is rewritten.

## A pending entry in this release says otherwise

The objectui#9556 entry says the alias "gains no reader and loses none" and
leaves this retirement open. That describes that change, not the release: this
one retires the alias on the two blocks. That entry now carries a dated note
saying so.
