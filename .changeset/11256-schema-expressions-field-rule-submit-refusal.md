---
---

Docs only, in the published `objectui` skill: the field-level conditional rules
passage of `skills/objectui/guides/schema-expressions.md` still taught that a
broken predicate "never blocks submit". Since objectui#8069 landed ADR-0137 D2, a
faulted or stored-blank field rule refuses the submit and names the field and the
rule, while render stays fail-open (D3); the passage now says so, keeps "never a
security boundary on the client", and adds that a blank triad key is refused at
authoring and a blank gate stays "no gate" with a diagnostic. No package is
released by this change (objectui#11256).
