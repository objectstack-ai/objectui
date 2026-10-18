---
'@object-ui/app-shell': patch
---

Retire what the post-build transition left behind after objectui#12724 (objectui#12842).

objectui#12724 removed the automatic navigation into Studio after an AI build, so two pieces lost their other half:

- **The Studio run-mode landing.** The Interfaces pillar no longer reads a router state asking it to open on 「运行」 with the properties aside collapsed. `studioLanding.ts` (`STUDIO_RUN_LANDING`, `isStudioRunLanding`) is removed; nothing sent that state any more. Every arrival opens on 「设计」 with the properties aside open, which is what every arrival already did.
- **The full-page opt-out flag.** The console dock's and the Studio copilot's full-page buttons no longer write `sessionStorage['objectstack:ai-full-page-requested']`; its only reader was the retired transition. Both buttons still record where they were pressed and open the build surface, as before.

`artifactStudioPath`'s doc comment no longer cites an "ADR-0080 D5" that does not exist; it states the rule (every AI-built artifact links to the Studio pillar where it can be edited by hand) and cites objectui#2623, which introduced it.

Clause-②: no
Neither name was exported from the `@object-ui/app-shell` entry, the session-storage key was internal, and no prop or language-pack key moves.
