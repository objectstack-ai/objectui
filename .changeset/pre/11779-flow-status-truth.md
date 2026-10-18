---
'@object-ui/app-shell': patch
---

Studio's Automations pillar now shows the state a flow actually runs in, and shows it the same way in the rail, the flow header and the Problems panel (objectui#11779).

- **Trigger.** The flow header's Trigger pill reads the trigger the flow's Start node declares, in the Start node inspector's own words. A record-triggered flow reads its event and object (for example *Record updated · task*), where it read the flow type *autolaunched*. A flow with no trigger on its Start node still reads its type.
- **Status.** The header's Status pill reads the engine's runtime state for the flow, as the rail does: *On*, *Off*, *Not running here*, or *Unpublished draft* for a flow the engine does not have. A published flow without a `status` key used to read *draft*, although the engine runs it. Where no runtime state is available (the metadata-admin page, or a backend without `GET /api/v1/automation/_status`), the pill reads the flow's own switch: *Enabled* or *Disabled*.
- **Not running here.** An enabled flow whose declared trigger is not armed on this deployment, such as a scheduled flow while package-authored scheduled work is switched off, reads a grey *Not running here* in the rail and the header instead of a green *On*. Its hover text is the platform's reason, and the Problems panel shows the same reason as a note, which is not counted as a problem. A flow that declares no trigger still reads *On*.
- **New flows start off.** A flow created with *New* is saved with `status: 'obsolete'`, so its switch reads *Disabled*, as the "Off by default · review before enabling" bar says. It used to read *Enabled*, and a package publish armed it as soon as it had a trigger.
