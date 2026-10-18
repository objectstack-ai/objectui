---
'@object-ui/plugin-detail': minor
---

`record:path`: a stage derived from a picklist now takes its terminal from the option's declared lifecycle `kind` (objectstack#23809) — `won` is the forward terminus, `lost` sits in the separated group, `open` is a middle step — instead of guessing it from the value's spelling. The spelling heuristic stays the fallback for options that declare no kind (objectui#12907). Two published types gain an optional member: `deriveStages`' return type adds `terminal?: 'won' | 'lost'`, and `ObjectDefFieldLike.options[]` adds `kind?: SelectOptionKind`.
