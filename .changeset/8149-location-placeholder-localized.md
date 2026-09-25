---
'@object-ui/fields': patch
---

`LocationField`'s fallback placeholder now speaks the reader's language
(objectui#8149).

When a `location` field declares no `placeholder`, the box used to show the
English literal `latitude, longitude`. objectui#6888 had already keyed the two
coordinate nouns for the widget's residue refusal, so on a Chinese console the
box said `latitude` while the refusal one line beneath it said the Chinese word
for the same coordinate. The fallback is now composed from those same keys,
`fields.location.latitude` and `fields.location.longitude`, which extends
objectui#6755's principle — a widget's own copy is keyed — to placeholder copy,
as objectui#3342 did for `TagsField`.

**An authored `placeholder` still wins**, verbatim, in every language.

**The order and the separator stay the widget's.** The box reads what is typed
by splitting on an ASCII comma and taking the first part as the latitude, so
the hint's `, ` is input grammar rather than punctuation. A pack-owned joiner
could have written its own script's comma (fullwidth, ideographic or Arabic),
each of which the box refuses, and the hint would then have taught a format the
box will not read. This is objectui#8148's settlement applied to the separator:
there, no pack spells an example digit; here, no pack spells the separator.
Every pack already writes its refusal's example pair with the same ASCII
separator.

**No new keys, and English does not move.** Under `en`, and with no
`I18nProvider` mounted, the placeholder is byte-identical to the literal it
replaces.
