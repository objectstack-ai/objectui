---
'@object-ui/cli': patch
---

`objectui check` prints the key and path a file was refused for, and no longer ends with 「✓ All checks passed」 over files it never validated (objectui#11007).

`check` recognises a JSON file in one of two ways: by a structural root key (`children`,
`className`, …), which admits the file without parsing it, or by the whole document
validating.

- **A file that did not validate now carries its reason.** Each entry in the "did not validate"
  list gets one indented line: the validator's first issue, its path spelled the way
  `objectui validate` prints it, and its message, with the issue count when there is more than
  one. A root `object-map` whose `map` block carries the typo `latitudeFieId` was listed by file
  and type only. It now reads `Issue at map: Unrecognized key: "latitudeFieId"`. The issue comes
  from the parse `check` already ran to recognise the file. Skipped files, which are foreign,
  still get no diagnosis.
- **The closing line is a tally, not a pass.** A run with no parse errors used to end on
  「✓ All checks passed」, including over a page whose nested node carries a refused key: that
  page is admitted on `children` and never parsed. The line now counts the recognised files
  that validated, those recognised by a structural key and not validated, and those that did
  not validate, and points to `objectui validate <file>` for a verdict.

`check` still does not parse a file its structural key admits. The verdict on a document stays
`objectui validate`'s, and `check` still exits non-zero on unreadable JSON only, so no exit code
changes. `objectui validate`'s output is unchanged: its path spelling moved into a helper both
commands share.
