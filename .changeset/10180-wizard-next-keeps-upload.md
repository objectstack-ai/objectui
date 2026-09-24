---
'@object-ui/fields': patch
'@object-ui/plugin-form': patch
---

A wizard no longer writes a record without a file whose upload was still running when the user
pressed Next (objectui#10180).

To reproduce: pick a file on a wizard step, press Next before the upload finishes, then press
Create on the last step before the upload settles. The record was written WITHOUT the attachment
and the wizard reported success.

The upload itself was never cancelled. `FileField` and `ImageField` do not abort an upload
when their step unmounts, and when it finishes the value still reaches the form. What went
missing was the upload's REPORT. A widget publishes "an upload is in flight" as its own
React state, so leaving the step unmounted the widget and ended the report while the
upload kept running. The final-commit gate objectui#10166 put on the wizard then read
"nothing uploading": Create was enabled and labelled "Create", and pressing it in that
window wrote the record before the file arrived.

`FileField` and `ImageField` in `@object-ui/fields` now also hold the enclosing uploading
scope for the upload's own lifetime; `FileCell`, the line-item grid cell, does not. The hold
is taken when the upload starts and released once the upload settles, whether or not the
widget is still mounted: after the value has been handed to the form when it succeeds, and
on a failure too. While a file from an earlier step is still uploading, the wizard gives the
same answer objectui#10166's gate gives for any other in-flight upload. Create reads
"Uploading…" and is disabled, the wizard shows the reason it already gives, and a submit
that reaches it anyway is refused, not queued. A Create pressed once the upload settles
writes the record with the file. `Next` is not gated, and no new element or message is
introduced: the label and the reason are the ones objectui#10166 added.

No exported symbol, prop or type changes. `useUploadingScope().anyUploading` now stays
true until an upload that `FileField` or `ImageField` started inside the scope has settled,
instead of going false when that widget unmounts. A widget that publishes only through the
exported `useUploadingSignal` still releases its report when it unmounts, as before, so an
upload such a widget leaves running after it unmounts is not visible to the scope. A hold
can last only as long as its upload is unsettled, which is the same limit a mounted widget's
report already has.
