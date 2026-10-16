---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The marketplace package page's **Update** button opens an update dialog, and a package README's raw HTML is no longer printed as text (objectui#12146).

**The update dialog.** When this environment holds an older version of a package, the page's primary button reads "Update"; it used to open the install dialog unchanged, so an admin updating a package read "Install", saw no versions, got no word about a major-version jump, and was offered "Include sample data" with no explanation. The same dialog now opens as an update:

- the title, description and primary button say update ("Update HotCRM", "Update the copy installed in this environment", "Update" / "Updating…");
- it names the installed version and the version it moves to (`v3.1.0 → v4.0.1`), both the ones the page already shows;
- a major-version jump adds one line saying so, with a link to the target version's release notes in the page's Versions panel (only when that version carries notes); following it closes the dialog and moves focus to those notes;
- there is no "Include sample data" checkbox, and the update requests no sample data (`seedSampleData: false`). Sample data for an installed package stays with the page's own "Add sample data" action;
- the result reads "Updated to v4.0.1", and a wait that expires says the update was recorded but the new version is not served yet.

Installing a package this environment does not hold opens the dialog exactly as before.

**README raw HTML.** The About card's markdown renderer printed a README's raw-HTML block (a centred logo paragraph, say) as literal text. It now recognises raw HTML by CommonMark's own grammar, the HTML-block start conditions and the inline raw-HTML forms, and skips it: neither rendered, since a README is third-party content, nor printed. HTML inside a code span or a fenced code block is code and still prints, and text that only looks like a tag (`a < b`, an angle-bracketed URL) stays text.

**Locale keys.** `marketplace.update.dialogTitle`, `dialogDescCurrent`, `dialogDescPicker`, `majorNotice`, `releaseNotes`, `success` and `deployTimeout`, and `marketplace.action.updating`, in all ten packs.

**Clause-②: yes (widening)**: eight locale keys added to `@object-ui/i18n`'s published packs, which widens `TranslationKeys`. No export, prop or accept set moves.
