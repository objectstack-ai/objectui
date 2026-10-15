---
"@object-ui/types": major
"@object-ui/core": major
"@object-ui/i18n": major
"@object-ui/react": major
"@object-ui/components": major
"@object-ui/react-runtime": major
"@object-ui/sdui-parser": major
"@object-ui/fields": major
"@object-ui/layout": major
"@object-ui/data-objectstack": major
"@object-ui/cli": major
"@object-ui/create-plugin": major
"@object-ui/runner": major
"@object-ui/auth": major
"@object-ui/permissions": major
"@object-ui/mobile": major
"@object-ui/plugin-ai": major
"@object-ui/plugin-calendar": major
"@object-ui/plugin-charts": major
"@object-ui/plugin-chatbot": major
"@object-ui/plugin-dashboard": major
"@object-ui/plugin-designer": major
"@object-ui/plugin-detail": major
"@object-ui/plugin-editor": major
"@object-ui/plugin-form": major
"@object-ui/plugin-gantt": major
"@object-ui/plugin-grid": major
"@object-ui/plugin-kanban": major
"@object-ui/plugin-list": major
"@object-ui/plugin-map": major
"@object-ui/plugin-markdown": major
"@object-ui/plugin-report": major
"@object-ui/plugin-timeline": major
"@object-ui/plugin-tree": major
"@object-ui/plugin-view": major
"@object-ui/collaboration": major
"@object-ui/app-shell": major
"@object-ui/providers": major
"@object-ui/console": major
"object-ui": major
---

objectui moves to major 18, following `@objectstack/*` from 17 to 18 (objectui#12334). objectui's major is not a count of its own breaking changes: it tracks the major of the `@objectstack/spec` its packages depend on, so that the same major means compatible across the two projects. These packages already declare `@objectstack/*` on the 18 line (objectui#12030), so every package in the fixed release group crosses to 18 together. It is the one `major` that rule admits: objectui's own breaking changes ship as `minor`, described in their entries.

The 18 line is released from Changesets pre mode on the `next` tag (`.changeset/pre.json`), as `@objectstack/*` 18 is: these releases are `18.0.0-next.N` on the npm `next` dist-tag, and they do not move `latest`. The first `18.0.0` on `latest` comes when `@objectstack` 18 is generally available and this repository leaves pre mode.

What a consumer must do to take it is in the `@objectstack/*` 18 entry of this release (objectui#12030): move its own `@objectstack/*` packages to the 18 line at the same time.
