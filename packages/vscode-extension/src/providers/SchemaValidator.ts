import * as vscode from 'vscode';

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

    // Recursively validate children
    if (schema.body) {
      const children = Array.isArray(schema.body) ? schema.body : [schema.body];
      children.forEach((child: any, index: number) => {
        this.validateSchema(
          child,
          diagnostics,
          document,
          `${path}.body[${index}]`
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
   */
  private findPropertyRange(
    document: vscode.TextDocument,
    path: string,
    property: string
  ): vscode.Range {
    // For now, return the start of the document
    // In a full implementation, this would parse the JSON and find the exact location
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
