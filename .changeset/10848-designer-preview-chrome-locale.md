---
'@object-ui/app-shell': patch
---

fix(app-shell): the preview error heading, the flow screen preview and the Debug run's CEL error frames read the designer locale (objectui#10848)

Under zh-CN these designer words stayed English beside Chinese text:

- the heading "Preview failed to render" that every designer preview's error
  boundary shows above the thrown message;
- the flow screen preview, in the flow node inspector and in the Debug run's
  paused screen: its "Preview" header, the text shown while a screen has nothing
  configured, the disabled "Submit" button, the note shown when an object-form
  screen has no backend to preview against, and the note counting fields hidden
  by their "visible when" condition;
- the frames the Debug run puts around a CEL failure on a step or an out-edge
  ("condition failed to evaluate as CEL: ", "CEL evaluation failed: "), and the
  "Evaluation failed." fallback when the failure carries no message.

Each new en row is the English the literal carried, so en renders unchanged. The
text inside a CEL frame is the expression engine's own and passes through as it
is, as does the message a failing preview threw. A screen's title, description
and field labels are author data and show as written in every locale.
