---
'@object-ui/app-shell': patch
'@object-ui/plugin-designer': patch
---

Correct the user-visible refusal banner that told authors a blank relationship
target would be accepted by the installed `@objectstack/spec` (objectui#8897).

`MetadataService` and `MetadataFieldsPage` both refuse a `lookup` /
`master_detail` field whose `reference` trims to empty, and both explained the
refusal by saying the spec **accepts** the value, "so the PUT would succeed and
the failure would surface later and further away". That was measured and true at
`@objectstack/spec` 17.3.0. The pin is 17.4.0 (objectui#8772), which carries
objectstack#16920 — the emptiness test now applies to the TRIMMED value — so
against the artifact this repo actually installs, the PUT would **not** succeed.
The product was asserting to authors something the installed artifact
contradicts.

Measured on the installed 17.4.0 artifact, with controls in the same run:

    FieldSchema.safeParse({ type:'lookup', label:'L', reference:'   ' })
      => success = false, custom at ["reference"]
    ObjectSchema.safeParse({ …, fields:{ rel:{ …, reference:'   ' } } })
      => success = false, custom at ["fields","rel","reference"]
    controls: reference:'account' and reference:' account ' both ACCEPTED

The banner now names the trim the contract applies — which is what still tells a
blank target apart from an empty one now that both are refused — and promises
the 422 it previously had to withhold. The verbatim pin on that sentence moved
with it, in the same commit.

⛔ **The guard's predicate is byte-identical.** objectui#8621 ruled it stays for
its own reason: it refuses at EDITOR time, before the PUT, naming the field while
it is still on screen. Only its stated *reason* was wrong.

⛔ Statements about **when** the contract changed ("17.3.0 made `reference` a
hard requirement", "at 17.2.0 the requirement was prose only") are permanently
true and were not touched; only statements about **what is installed** were.
