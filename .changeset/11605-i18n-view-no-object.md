---
'@object-ui/i18n': minor
---

All ten locale packs gain `view.noObject`, the hint an object-bound block shows
when its node names its object in neither place (objectui#11605).

**Clause-②: yes (widening)** — a new key, `view.noObject`, in every pack. English
reads "No object named: set {{property}} or dataSource.object.", the wording of
`element.number.noObject` with the property as a hole; each translation is that
key's own translation with the same hole. `{{property}}` is the block's object
key, interpolated and never translated. No existing key changes.
