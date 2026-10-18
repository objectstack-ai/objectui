---
'@object-ui/app-shell': patch
---

Studio's API tab shows an example create body the server would accept (objectui#11803).

- **Each value fits its field's type.** The example used to type every field it did not list by name as `"string"`, including selects, locations and times. Each value now follows the stored form the record write path accepts for that type, read from `@objectstack/spec`'s field-value contract: a select or radio shows its first option's code, a location a `{ "lat", "lng" }` object, a time `HH:MM`, an email, URL or phone value in a valid format, a lookup a record id, and a file field a file id. A multi-valued field shows an array. A number stays inside the field's declared `min` and `max`, a text value inside its `minLength` and `maxLength`, and a text field with a `valueDomain` shows a member of that domain.
- **Every required field is listed.** The example used to stop at the first 8 writable fields in the order the server returns them, which put platform columns such as `owner_id` ahead of the object's own fields, and left out a required field declared later. Required fields now come first and are always listed. Optional fields follow, the object's own before the platform's, up to 8 fields in all. A line under the example names the optional fields it leaves out.

The copied cURL already carried the `Authorization: Bearer` header; that is unchanged. Nothing is added to the package entry: no export, prop or language-pack key. The new line's copy lives in the metadata-admin designer's own string table (en and zh).
