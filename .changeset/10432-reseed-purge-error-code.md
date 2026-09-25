---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

fix(app-shell): a cloud Re-seed / Purge refused with `ENVIRONMENT_KERNEL_UNAVAILABLE` now says why and stops offering the retry

`reseedSampleData` and `purgeSampleData` kept only the text of a refusal and
dropped its error code. On a 500 that text is the control plane's withheld
generic sentence, so the package page showed the same message for every server
fault. That included a control plane with no environment kernel, where the two
actions can never succeed (cloud#2072).

Both calls now return the code beside the text. When the code is
`ENVIRONMENT_KERNEL_UNAVAILABLE`, the package page says that this control plane
has no environment kernel and that the action must be run from the
environment's own runtime, and it disables both cloud sample-data actions for
the rest of the visit. Every other code, `INTERNAL_ERROR` included, keeps
today's message and leaves the actions enabled. The HTTP status handling is
unchanged.

`@object-ui/i18n` carries the new sentence as `marketplace.detail.sampleDataKernelUnavailable`
in all ten locale packs.
