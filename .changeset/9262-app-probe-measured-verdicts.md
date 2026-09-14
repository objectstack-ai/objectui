---
'@object-ui/data-objectstack': minor
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The console's "app not available" screen now says what it measured, and the by-name app
probe stopped folding four answers into one (objectui#9262).

**BREAKING for consumers of the published `AppAccessVerdict` type.** `probeAppAccess`
widens by two members ruled by the maintainer: `granted | denied | unknown` becomes
`granted | denied | not_found | unreachable | unknown`. A consumer that exhaustively
switches on the verdict gains two cases. The meaning of `unknown` also narrows — it no
longer means "an absent app, an unreachable server, or an adapter that cannot ask", it
means only that nothing was asked (a host DataSource without this probe). Code that read
`unknown` as a positive absence must move to `not_found`.

**What users see.** The sentence `This app is not available yet — it may still be
publishing. Try again in a moment.` is retired from all ten locale packs. It was asserted
for seven distinct causes, only one of which is a publish, and it is the screen an author
lands on after any of them — the same defect objectui#4252 split `denied` off this screen
for. In its place: `This app can't be opened` for a measured absence, `Couldn't reach the
server` for a probe that got no answer, the unchanged denial screen for a permission
refusal, and a neutral `App not available` when nothing was measured. All but the denial
keep the Retry button, because all but the denial can change on their own. A genuine
post-publish lag reads as an absence, and the one forced metadata refresh that gives that
lag its chance to resolve is unchanged.

**Measured before the branches were written.** On a real server the by-name route answers
`200` with the declared envelope MINUS its `item` for a name that does not exist — not the
`404` this code assumed — so `probeAppAccess` returned `granted` for every typo, every
never-created app and every unpublished draft. `granted` fell through to the same screen as
`unknown`, which is why nothing showed. Absence is therefore read from the envelope as well
as from the `404` code; a `not_found` branch keyed on the status alone would have been dead
for the commonest case.
