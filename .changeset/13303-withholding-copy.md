---
"@object-ui/react": patch
---

The console line for a visibility predicate that cannot be evaluated, on a gate that withholds what it gates, no longer says "a navigation entry" was withheld. The same line is printed for a navigation entry, a `page:tabs` item and a page node, so it now says "an element whose visibility predicate cannot be evaluated is WITHHELD". The verdict, the line's opening, and when it is printed are unchanged (objectui#13303).
