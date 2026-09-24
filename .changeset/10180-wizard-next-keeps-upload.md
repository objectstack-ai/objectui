---
'@object-ui/fields': patch
'@object-ui/plugin-form': patch
---

A wizard no longer drops a file whose upload is still running when the user presses Next (objectui#10180).

To reproduce: pick a file on a wizard step, press Next before the upload finishes, then press Create on
the last step. The record was written WITHOUT the attachment and the wizard reported success.

The upload itself was never cancelled. `FileField` and `ImageField` do not abort an upload
when their step unmounts, and when it finishes the value still reaches the form. What went
missing was the upload's REPORT. A widget publishes "an upload is in flight" as its own
React state, so leaving the step unmounted the widget and ended the report while the
upload kept running. The final-commit gate objectui#10166 put on the wizard then read
"nothing uploading": Create was enabled and labelled "Create", and pressing it in that
window wrote the record before the file arrived.

The upload widgets in `@object-ui/fields` now also hold the enclosing uploading scope for
the upload's own lifetime. The hold is taken when the upload starts and released when its
promise settles, after the value has been handed to the form, whether or not the widget is
still mounted. Pressing Create while a file from an earlier step is still uploading now
gets the same answer as #10166's gate gives for any other in-flight upload: Create reads
"Uploading…", and the wizard shows the same reason it already gives. Once the upload
settles, the record is written with the file. `Next` is not gated, and nothing new is
rendered.

No exported symbol, prop or type changes. `useUploadingScope().anyUploading` now stays
true until an upload started inside the scope has settled, instead of going false when
that upload's widget unmounts. A hold can last only as long as its upload is unsettled,
which is the same limit a mounted widget's report already has.
