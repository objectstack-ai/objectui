---
'@object-ui/app-shell': patch
'@object-ui/plugin-designer': patch
---

fix(app-shell, plugin-designer): three more forms keep the required `*` out of the control's accessible name

A flow screen's input fields (`ScreenView`), the metadata-admin `SchemaForm` and
the `AppCreationWizard` basic step each drew the required marker as a bare `*`
inside the label that names the control. A screen reader therefore announced
"Title *" instead of "Title", and none of those controls reported that it was
required.

The marker is now `aria-hidden`, the rule `ActionParamDialog` and `FormPage`
already follow (objectui#3299, objectui#10178): the `*` is for sighted users, and
the requirement is announced as `aria-required` on the control. Each marker also
carries `data-required-marker="true"`, the same locator the shared form
renderer's marker uses.

- `ScreenView`: every field control (text, number, email, date, textarea,
  checkbox and select) carries `aria-required` when the field is required.
- `SchemaForm`: the marker is hidden in the default row, in the boolean row, and
  in a grid repeater's column header, which names every cell below it. The
  controls `SchemaForm` renders itself (select, switch, number and text inputs,
  textarea, the comma-separated list input and the JSON editor) carry
  `aria-required` from the same flag that draws the marker.
- Metadata-admin widgets: `WidgetProps` gains an optional `required` member, and
  `SchemaForm` passes the same flag to a registered widget, in a row and in a
  grid cell. Ten of the eleven `labelling: 'control'` widgets put it on their
  control as `aria-required`: `ref:object`, `ref:component`, `object-selector`,
  `field-selector`, `field-ref`, `view-ref`, `icon`, `color-input`,
  `string-tags` and `secret`. `filter-builder` does not, because its control is
  a plain button, where ARIA does not allow `aria-required`.
- Colour picker: `ColorVariantPicker` takes an optional `required` and puts
  `aria-required` on its radio group, and the `color-picker` widget passes the
  field's flag through. Its other callers pass nothing, so they are unchanged.
- `AppCreationWizard`: the App name and Title inputs carry `aria-required`.

Native `required` is not added anywhere, so no browser validation appears beside
each form's own required check.
