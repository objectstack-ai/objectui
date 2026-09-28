---
'@object-ui/app-shell': patch
---

fix(app-shell): the action, agent, skill, tool and job previews and the CEL try-it dialog read the designer locale (objectui#10862, slice 1)

Under zh-CN these designer surfaces rendered their own words in English beside
Chinese text:

- the action preview: its pills ("AI: opted out", "AI: exposed", "refresh
  after" and the type / object / variant labels), the "Visible when" and
  "Disabled when" lines, the "On click" sentence for every action type, the
  "Where it appears" frames and their capability note, the input and result
  dialog mocks, and the test-request panel;
- the agent, skill, tool and job previews: their empty prompts, section
  headings, pills, table headers, notes, the "Try in chat" and "Open in API
  Console" links and their tooltips, and the job's next-run list;
- the RLS policy editor's CEL try-it dialog: the result for an empty
  predicate, the "Evaluation failed." fallback when the engine gives no
  message, and the "expected a JSON object." refusal for a sample.

Each new en row is the English the literal carried, so en renders unchanged.
Author data (labels, names, instructions, condition sources, handler keys),
identifiers (enum tokens, location keys, object and capability names,
JSON-Schema types, compact durations such as `5m`, the name "Cron") and the
expression engine's own messages show as written in every locale.

This is slice 1 of objectui#10862 (the flow / automation previews). The
object / data previews and the admin previews remain for the later slices.
