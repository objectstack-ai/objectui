## Plan: ObjectUI Component Implementation & CRM Integration

This plan outlines the roadmap to implement the full ObjectUI component suite following the `@objectstack/spec` protocol and integrate it into `examples/crm-app`. We will prioritize the Core engines (Actions/Expressions) and critical CRM fields before addressing complex plugins.

### Steps

1.  **Core Engine Implementation (The "Brain")**
    *   Implement **Action Engine** in [`packages/core`](packages/core/package.json) to handle events defined in `ActionSchema` (`navigate`, `submit`, `validate`).
    *   Implement **Expression Evaluator** in [`packages/core`](packages/core/src) to parse string expressions (e.g., `${data.amount > 1000}`) for dynamic visibility/disabled states.
    *   Create `useActionRunner` and `useExpression` hooks in [`packages/react`](packages/react/src) to expose these engines to components.

2.  **Essential CRM Fields (The "Inputs")**
    *   Implement `LookupField` in [`packages/fields`](packages/fields/src) (critical for CRM relationships) using a modal/combobox pattern.
    *   Implement `CurrencyField` (money formatting), `TextArea`, and `RichText` (markdown/HTML) editors.
    *   Register these new fields in the `FieldRegistry` within [`packages/fields`](packages/fields/src).

3.  **View & Form Layouts (The "Structure")**
    *   Enhance `FormView` in [`packages/renderer`](packages/renderer/src) to support `sections`, `tabs`, and `groups` layout schemas.
    *   Implement `ListView` components for generic collections, ensuring `Grid` and `Kanban` plugins are correctly loaded dynamically.
    *   Update `SchemaRenderer` to correctly delegate `view:*` types to these new layout components.

4.  **Heavy Plugin Implementation (The "Widgets")**
    *   Implement `plugin-charts` using Recharts for `dashboard` widgets (`bar`, `line`, `pie`).
    *   Implement `plugin-calendar` using FullCalendar for `view:calendar`.
    *   Ensure plugins are lazily loaded in `examples/crm-app` to maintain performance.

5.  **CRM App Integration & Verification**
    *   Update [`examples/crm-app`](examples/crm-app/src) to register the new Field and Plugin packages.
    *   Refactor hardcoded CRM pages to use the new `Action` and `Lookup` components via JSON schema.
    *   Verify the "Opportunity Deal" flow (edit amount, change stage, link account) works purely via the new components.

### Further Considerations
1.  **Component Registry Strategy:** Should we auto-register all components in a bundle, or require the user (CRM app) to explicitly import and register each package to save bundle size? (Recommendation: Explicit registration).
2.  **Styling Consistency:** Ensure all new inputs in `@object-ui/fields` strictly follow the Shadcn UI themes defined in `@object-ui/components`.