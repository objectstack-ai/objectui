---
'@object-ui/types': minor
'@object-ui/plugin-report': minor
'@object-ui/core': patch
'@object-ui/i18n': patch
'@object-ui/components': patch
'@object-ui/fields': patch
'@object-ui/app-shell': patch
'@object-ui/console': patch
'@object-ui/plugin-charts': patch
'@object-ui/plugin-chatbot': patch
'@object-ui/plugin-dashboard': patch
'@object-ui/plugin-designer': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-form': patch
'@object-ui/plugin-grid': patch
---

Dates and numbers across the console and the plugins format in the session's
display locale instead of the machine's (objectui#9909).

Every one of these faces handed `Intl` — directly, or through a formatter called
without one — either no locale tag or an explicit `undefined`, which is not "the
user's locale": it is the locale of the machine the browser runs on, which is
neither of this repository's two locale channels.
A German or Spanish session therefore read, beside a translated label, a date or
an amount grouped and decimal-marked the machine's way — and an amount with
inverted separators does not read as unformatted, it reads as a different
number. They now go through `useDisplayLocale()` (tenant regional default, then
the active UI language, then `'en'`), and a plain helper takes that tag from its
caller. The surfaces:

- **`@object-ui/fields`** — `GridField`'s numeric and currency cells (list mode
  and computed columns) and both total cells. The same cell helper's date branch
  already used the display locale, so a single grid row read two conventions at
  once.
- **`@object-ui/plugin-charts`** — ISO-date x-axis ticks, compact y-axis ticks,
  the single-value face, spec `format` strings and the tooltip value.
- **`@object-ui/app-shell`** — the organization invitations, members and
  accept-invitation dates; marketplace version dates; the AI conversation row's
  older-than-a-week date and its tooltip; the build-debug token count; the
  record approvals timeline; and the metadata-admin audit, history, external
  datasource snapshot, schema-browser row estimate, flow-run start and job
  next-fire faces. The audit, history and flow-run panels format these in the
  DISPLAY locale, not in the `locale` prop they take for their UI strings
  (`AuditPanel` defaults that prop to `'en-US'`; `HistoryPanel` and
  `FlowRunsPanel` leave it optional).
- **`@object-ui/console`** — the approvals inbox's timestamp tooltips, amounts
  and payload summary; the audit log's timestamp column; the flow runs table and
  its run detail.
- **`@object-ui/components`** — the export dialog's record counts and the debug
  panel's event times.
- **`@object-ui/plugin-form`** — the analytics submission count, the
  master-detail subtotal / tax / total stack and the edit-conflict dialog's
  "their save" time.
- **`@object-ui/plugin-chatbot`** — the approvals inbox's past-30-days date and
  the times stamped on local-mode chat messages (the user's and the
  auto-response).
- **`@object-ui/plugin-dashboard`** — the record-count badge, and the currency
  and date-format branches of `renderFieldValue`, which was handed the display
  locale and spent it only on its percent branch.
- **`@object-ui/plugin-grid`** — the record-detail panel's inferred currency
  value and the mobile card's amount line, siblings of date cells already on the
  display locale.
- **`@object-ui/plugin-designer`** — `VersionHistory`'s version times.

A host that mounts one of the components that newly read the display locale with
NO `I18nProvider` now gets react-i18next's once-per-module `NO_I18NEXT_INSTANCE`
notice in the console on the first such mount; the faces still render, in the
channel's `'en'` last resort, and mounting an `I18nProvider` (as the console
does) avoids the notice.

**Additive API** (nothing that compiled before stops compiling):

- `@object-ui/types`: `ValidationContext` gains an optional `locale`. The
  `@object-ui/core` validation engine prints the `date_min` / `date_max` bound in
  it; omitted, `Intl` follows the runtime default, as `formatDisplayNumber`
  already declares for a caller with no locale in hand.
- `@object-ui/plugin-report`: `exportReport`, `exportAsHTML` and `exportAsPDF`
  take a trailing optional `locale` for the exported file's "Generated:" time,
  and `LiveExportOptions` gains an optional `locale` that `exportWithLiveData`
  forwards. Omitted, the time uses the display channel's own last resort
  (`'en'`), never the machine's locale. `ReportViewer` passes the session's
  display locale. The locale is deliberately NOT a `ReportExportConfig` member:
  that type is authored report metadata, and a display locale belongs to the
  session.

**One census, repository-wide.** `plugin-detail`'s machine-locale census pin
(objectui#9786) is now a single test, `machineLocaleCensus-9909.test.ts` in
`@object-ui/i18n`, covering every workspace package whose manifest depends on
`@object-ui/i18n`. It refuses any call site that passes nothing, `undefined`,
the `'default'` pseudo-tag (a subtag no locale data answers, so `Intl` resolves
it to the machine's locale) or a hard-coded tag, unless the site is declared
with its reason — for example the `catch` fallback for a tag `Intl` itself
rejected, or an ISO formatter feeding `<input type="date">`. Each declared site
is counted exactly, so deleting one without its entry is refused too. The
per-package pin it replaces is deleted. The runtime tripwire that observes the
argument each locale-taking call (`Intl` constructors, `Date` and `Number`
`toLocale*`) actually receives moved into the private `@object-ui/test-support`
package, and every surface above is pinned with it: the same data under two
declared locales must render differently, NO locale-taking call may receive the
machine's locale (nothing, `undefined` or `'default'`), and the surface's own
calls must receive the declared tag. A call carrying another declared tag, such
as the `'en'` of the session's UI language, is tolerated by design: only the
machine's locale is the defect.
