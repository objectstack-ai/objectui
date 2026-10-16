---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Setup › Packaged automation keeps a flow row to the table's height when the platform says why the flow is not armed (objectui#12609).

The runtime's `reason` sentence for an enabled flow that is not armed used to render as a paragraph under the flow's name, so every such row grew to several lines and the table stopped scanning as a table. The sentence now opens from a small "Details" chip on the name's line, in a popover that shows it whole and unedited, in muted text. A row without a reason shows no chip and renders as before.

The chip does not say what the reason is. Its label is the same on every row that carries a reason, whatever the sentence says, because the contract says the field is rendered and never parsed, and a deployment-policy row and a binding failure arrive in the same shape. The activation switch still shows the flow's `enabled` field, as before.

**Clause-②: yes (widening)**: `@object-ui/i18n`'s ten locale packs gain one key, `packagedAutomation.reasonDetails`. No export, prop or other key changes on either package.
