/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';

/**
 * The child-list spelling objectui#6771 retired. Spelled here rather than
 * imported: this package ships to the extension host with no `@object-ui/*`
 * runtime dependency, which is the same reason it has no zod tier to lean on.
 * `sdui-parser` exports the same constant as `RETIRED_CHILD_LIST_KEY`, and
 * `__tests__/body-dialect-children-arm-7181.test.ts` pins the two together.
 */
const RETIRED_CHILD_LIST_KEY = 'body';

/**
 * Validates Object UI schemas
 */
export class SchemaValidator {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('objectui');
  }

  /**
   * Validate a document
   */
  async validateDocument(document: vscode.TextDocument): Promise<void> {
    const diagnostics: vscode.Diagnostic[] = [];

    try {
      const text = document.getText();

      // Parse JSON
      let schema;
      try {
        schema = JSON.parse(text);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const match = errorMessage.match(/position (\d+)/);
        const position = match ? parseInt(match[1]) : 0;
        const pos = document.positionAt(position);

        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(pos, pos),
            `Invalid JSON: ${errorMessage}`,
            vscode.DiagnosticSeverity.Error
          )
        );

        this.diagnosticCollection.set(document.uri, diagnostics);
        return;
      }

      // Validate schema structure
      this.validateSchema(schema, diagnostics, document);

      this.diagnosticCollection.set(document.uri, diagnostics);

      if (diagnostics.length === 0) {
        vscode.window.setStatusBarMessage(
          '$(check) Schema is valid',
          3000
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Validation error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate schema structure
   */
  private validateSchema(
    schema: any,
    diagnostics: vscode.Diagnostic[],
    document: vscode.TextDocument,
    path: string = ''
  ): void {
    if (!schema || typeof schema !== 'object') {
      return;
    }

    // Check if type is specified
    if (!schema.type) {
      const range = this.findPropertyRange(document, path, 'type');
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          'Missing required property "type"',
          vscode.DiagnosticSeverity.Warning
        )
      );
    }

    // Validate type-specific properties
    if (schema.type) {
      this.validateTypeSpecificProps(schema, diagnostics, document, path);
    }

    // The retired `body` child-list spelling, answered BY NAME.
    //
    // ⚠️ THIS DIAGNOSTIC EXISTS BECAUSE THIS HOST HAS NO OTHER TIER. Everywhere
    // else, dropping the `body` arm moves the answer UP a level and makes it
    // louder: `@object-ui/types`' zod mirror refuses the key by name, so
    // `objectui validate` exits 1 naming `children`. The extension host imports
    // no zod, builds no manifest, and its JSON schema sets
    // `additionalProperties: true` — so without the push below, retiring the arm
    // would take a document that USED to draw a diagnostic here down to ZERO,
    // which is a refusal going quiet in the one tool whose job is teaching the
    // format. ⛔ That is the opposite of what objectui#6771 is for.
    if (schema[RETIRED_CHILD_LIST_KEY] !== undefined) {
      diagnostics.push(
        new vscode.Diagnostic(
          this.findPropertyRange(document, path, RETIRED_CHILD_LIST_KEY),
          `"${RETIRED_CHILD_LIST_KEY}" is a retired child-list spelling — author "children" instead (objectui#6771)`,
          vscode.DiagnosticSeverity.Warning
        )
      );
    }

    // Recursively validate children.
    //
    // `children` is the one child-list spelling. This guard once named
    // `schema.body` ALONE, so an author writing the declared spelling had
    // every child silently skipped by this recursion — no diagnostic, no
    // refusal, just an unvisited subtree (objectui#7181 added the `children`
    // arm). objectui#6771 then retired `body` itself, so the second arm went
    // with it: a `body`-spelled document has no child list for this recursion
    // to walk, and the push above is what keeps that from being silent.
    const childList = schema.children;
    if (childList) {
      const children = Array.isArray(childList) ? childList : [childList];
      children.forEach((child: any, index: number) => {
        this.validateSchema(
          child,
          diagnostics,
          document,
          `${path}.children[${index}]`
        );
      });
    }
  }

  /**
   * Validate type-specific properties
   */
  private validateTypeSpecificProps(
    schema: any,
    diagnostics: vscode.Diagnostic[],
    document: vscode.TextDocument,
    path: string
  ): void {
    const type = schema.type;

    // Validate input types
    if (type === 'input' && schema.inputType) {
      const validTypes = [
        'text',
        'email',
        'password',
        'number',
        'tel',
        'url',
        'search',
        'date',
        'time',
        'datetime-local',
      ];

      if (!validTypes.includes(schema.inputType)) {
        const range = this.findPropertyRange(document, path, 'inputType');
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Invalid inputType "${schema.inputType}". Must be one of: ${validTypes.join(', ')}`,
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }

    // Validate button variants
    if (type === 'button' && schema.variant) {
      const validVariants = [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ];

      if (!validVariants.includes(schema.variant)) {
        const range = this.findPropertyRange(document, path, 'variant');
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Invalid variant "${schema.variant}". Must be one of: ${validVariants.join(', ')}`,
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }

    // Warn about missing labels for form inputs
    if (
      (type === 'input' || type === 'textarea' || type === 'select') &&
      !schema.label
    ) {
      const range = this.findPropertyRange(document, path, 'type');
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          `Consider adding a "label" property for accessibility`,
          vscode.DiagnosticSeverity.Information
        )
      );
    }
  }

  /**
   * Find the range of a property in the document
   * Note: This is a simplified implementation that returns a default range.
   * TODO: For production use, implement proper JSON parsing to find exact property locations.
   * Consider using a JSON parser with position tracking or VSCode's built-in JSON language service.
   */
  private findPropertyRange(
    document: vscode.TextDocument,
    path: string,
    property: string
  ): vscode.Range {
    try {
      // Attempt to find the property in the document
      const text = document.getText();
      const searchPattern = new RegExp(`"${property}"\\s*:`);
      const match = searchPattern.exec(text);
      
      if (match && match.index !== undefined) {
        const pos = document.positionAt(match.index);
        return new vscode.Range(pos, pos.translate(0, property.length + 2));
      }
    } catch (error) {
      // If we can't find it, fall back to the beginning
      console.error('Error finding property range:', error);
    }
    
    // Fallback: return the start of the document
    return new vscode.Range(0, 0, 0, 1);
  }

  /**
   * Clear diagnostics
   */
  clear(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
