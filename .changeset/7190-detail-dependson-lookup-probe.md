---
---

Measurement-only change in `@object-ui/app-shell`: objectui#7190 asked whether a
`dependsOn` lookup gates on the DETAIL page. It was filed as a finding rather
than a bug on the reading that a detail page renders ONE record, and that
`LookupField`'s resolution then ended in a context tail
(`?? ctx.formValues ?? ctx.data`) a host might populate. That tail could never
fire — `SchemaRendererContextType` declares neither member — and objectui#7206
has since retired it, so the widget's `dependentValues` prop is the only
channel. Measured in the real host, it gated.

New `views/RecordDetailView.lookupDependsOn-7190.test.tsx` mounted the app-shell
record page, loaded a record carrying the parent value, entered inline edit by
double-click, and read the picker's own trigger. The declared lookup came back
`lookup-trigger-gated`, disabled, "Select region first" — while the `region`
field it names was on screen in the same edit session carrying `emea`. The
control lookup beside it (same reference, same record, no `dependsOn`) was
asserted enabled, so the gated reading was a measurement and not a broken
fixture. Both of `InlineFieldInput`'s call sites were covered — the details body
and the highlights strip — and both gated.

That change pinned the behaviour without fixing it. The repair has since landed
under the same card — see `7190-detail-inline-dependent-values.md` — and the same
test file now pins the enabled reading.

No behaviour change.
