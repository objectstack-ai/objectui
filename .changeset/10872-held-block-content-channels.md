---
'@object-ui/types': minor
---

The six public blocks that objectui#10872 batch 4 armed now refuse an authored `children`, and name the right remedy for a flat `body`: `action:button`, `action:icon`, `action:group`, `action:menu`, `element:definition-list` and `element:repeater` (objectui#10872, batch 5, by the objectui#9256 method).

**Clause-②: yes (narrowing).** On each of the six zod arms, `children` and `body` are declared as by-name refusals, each kept a member of the arm. Both refusals carry one message per block, from the same helpers the objectui#9256 arms use.

**What it was.** Batch 4 gave these blocks their arms, and each took `BaseSchema`'s channels as they were. So a node-level `children` on any of them parsed green on both faces (`safeValidateSchema`, and so `objectui validate`, and `StrictAnyComponentSchema`). None of their renderers reads the node's `children` or `body`, and `SchemaRenderer` strips both out of the props it spreads. So the child list rendered nothing, with no render-time error or warning and no element; only the parser tier's `not-a-container` warning (objectui#9910) noticed it. A flat `body` was already refused, by `BaseSchema` (objectui#6771), but its message pointed the author at `children`, the key that did nothing.

**What changed, in observable terms.**

- `children` on any of the six is refused with `invalid_type` at its own path, on both faces and nested in a page.
- `body` is refused as before, at the same path with the same code. The message no longer says "Did you mean `body` → `children`".
- The message names what the block renders instead, and so where the content goes:
  - `action:group` and `action:menu`: `properties.actions`;
  - `element:definition-list`: `properties.items`;
  - `action:button` and `action:icon`: the button's `properties.label` and `properties.icon`, which are its whole content.
- `element:repeater` has no content channel: each row prints fields of the queried record. Its message says so, rather than naming a key that would do nothing either.
- `@objectstack/spec`'s own `PageComponentSchema` refuses a node-level `children` on all six as an unrecognized key. This refusal brings objectui's face into line with the spec; it is not a second rule.

**Why `minor`, and why this breaks no published document.** `minor` follows the objectui#9256 narrowing precedent: this repo's version policy forbids `major` in any changeset (one `fixed` group), and records `minor` with an explicit note as the spelling of a narrowing. But this narrowing is not breaking against the last release. In `@object-ui/types` 17.6.0, every document naming one of these six types is refused with `invalid_union` at `type`, because the batch-4 arms are unreleased. They ship in the same release as this entry. So no published version ever accepted a `children` on these nodes: across the release, the accept set only widens.

No render behaviour changes. Nothing read these keys, which is why they can be refused.

Migration: put the content where the message says. A member action goes in `properties.actions`, and a term / description pair goes in `properties.items`. Anything else goes beside the node, in a container that reads `children` (`page:section`, `page:card`), or is dropped.
