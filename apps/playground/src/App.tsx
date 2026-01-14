import { useState, useEffect } from 'react';
import { SchemaRenderer } from '@object-ui/react';
import { Designer } from '@object-ui/designer';
import { SchemaNode } from '@object-ui/core';
import '@object-ui/components';
import { examples, exampleCategories, ExampleKey } from './data/examples';
import { Monitor, Tablet, Smartphone, Copy, Check, Code2, PenTool, LayoutTemplate } from 'lucide-react';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'code' | 'design' | 'preview';

export default function Playground() {
  const [selectedExample, setSelectedExample] = useState<ExampleKey>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  
  // Initialize state based on default example
  const initialCode = examples['dashboard'];
  const [code, setCode] = useState(initialCode);
  
  const [schema, setSchema] = useState<SchemaNode | null>(() => {
    try {
      return JSON.parse(initialCode) as SchemaNode;
    } catch {
      return null;
    }
  });

  // Sync code to schema when switching examples
  useEffect(() => {
    // When selectedExample changes, updating 'code' triggers parsing.
    // But we also need to ensure 'schema' is fresh for the Designer.
    try {
      const newSchema = JSON.parse(code) as SchemaNode;
      setSchema(newSchema);
    } catch {
      // ignore
    }
  }, [code]);
  
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [copied, setCopied] = useState(false);

  const updateCode = (newCode: string) => {
    setCode(newCode);
    try {
      const parsed = JSON.parse(newCode) as SchemaNode;
      setSchema(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
      // Keep previous schema on error
    }
  };

  const handleExampleChange = (key: ExampleKey) => {
    setSelectedExample(key);
    const newCode = examples[key];
    setCode(newCode);
    updateCode(newCode);
  };

  const handleDesignerChange = (newSchema: SchemaNode) => {
    const newCode = JSON.stringify(newSchema, null, 2);
    setCode(newCode);
    setSchema(newSchema);
  };

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const viewportStyles: Record<ViewportSize, string> = {
    desktop: 'w-full',
    tablet: 'max-w-3xl mx-auto',
    mobile: 'max-w-md mx-auto'
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      {/* 1. Sidebar: Example Selector */}
      <aside className="w-64 bg-muted/30 border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Object UI</h1>
          <p className="text-sm text-muted-foreground mt-1">Live Playground</p>
          
          <div className="mt-4 flex p-1 bg-muted rounded-md border">
            <button
              onClick={() => setViewMode('code')}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium rounded-sm transition-all ${viewMode === 'code' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Code Editor"
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
            </button>
            <button
              onClick={() => setViewMode('design')}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium rounded-sm transition-all ${viewMode === 'design' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Visual Designer"
            >
              <PenTool className="w-3.5 h-3.5" />
              Design
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium rounded-sm transition-all ${viewMode === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Live Preview"
            >
              <Monitor className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 space-y-6">
          {Object.entries(exampleCategories).map(([category, keys]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {category}
              </h2>
              <div className="space-y-1">
                {keys.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleExampleChange(key as ExampleKey)}
                    className={`
                      block w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                      ${key === selectedExample 
                        ? 'bg-primary text-primary-foreground font-medium' 
                        : 'hover:bg-muted text-foreground'
                      }
                    `}
                  >
                    {key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      {viewMode === 'design' ? (
        <div className="flex-1 h-full overflow-hidden bg-background">
          {schema && (
            <Designer 
              key={selectedExample} // Force re-mount on example change to reset designer state
              initialSchema={schema} 
              onSchemaChange={handleDesignerChange} 
            />
          )}
        </div>
      ) : viewMode === 'preview' ? (
        <div className="flex-1 h-full flex flex-col bg-muted/10 overflow-hidden">
          <div className="border-b px-4 py-3 bg-background flex items-center justify-between shadow-sm z-10">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              Live Preview
            </h2>
            
            {/* Viewport Size Toggles */}
            <div className="flex items-center gap-1 bg-muted rounded-md p-1 border">
              <button
                onClick={() => setViewportSize('desktop')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'desktop' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'
                }`}
                title="Desktop View"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewportSize('tablet')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'tablet' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'
                }`}
                title="Tablet View"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewportSize('mobile')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'mobile' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'
                }`}
                title="Mobile View"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-8 flex justify-center">
            <div className={`${viewportStyles[viewportSize]} transition-all duration-300`}>
              <div className="rounded-lg border shadow-sm bg-background p-6 min-h-[500px]">
                {schema && !jsonError ? (
                  <SchemaRenderer schema={schema} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {jsonError ? (
                      <div className="space-y-2">
                        <p className="text-red-500 font-semibold">Invalid JSON</p>
                        <p className="text-sm">Fix the syntax error to see the preview</p>
                      </div>
                    ) : (
                      <p>Select an example to get started</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex h-full overflow-hidden">
          {/* 2. Middle: Code Editor */}
          <div className="w-1/2 h-full border-r flex flex-col">
            <div className="border-b px-4 py-3 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">JSON Schema</h2>
              </div>
              <button
                onClick={handleCopySchema}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-background hover:bg-muted transition-colors border"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Schema
                  </>
                )}
              </button>
            </div>
            
            {jsonError && (
              <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                <strong>JSON Error:</strong> {jsonError}
              </div>
            )}
            
            <div className="flex-1 overflow-hidden">
              <textarea
                value={code}
                onChange={(e) => updateCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none border-0 bg-background text-foreground"
                spellCheck={false}
                style={{ 
                  tabSize: 2,
                  lineHeight: '1.6'
                }}
              />
            </div>
          </div>

          {/* 3. Right: Live Preview */}
          <div className="w-1/2 h-full flex flex-col bg-muted/10">
            <div className="border-b px-4 py-3 bg-muted/20 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Preview</h2>
              
              {/* Viewport Size Toggles */}
              <div className="flex items-center gap-1 bg-background rounded-md p-1 border">
                <button
                  onClick={() => setViewportSize('desktop')}
                  className={`p-1.5 rounded transition-colors ${
                    viewportSize === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewportSize('tablet')}
                  className={`p-1.5 rounded transition-colors ${
                    viewportSize === 'tablet' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewportSize('mobile')}
                  className={`p-1.5 rounded transition-colors ${
                    viewportSize === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
              <div className={`${viewportStyles[viewportSize]} transition-all duration-300`}>
                <div className="rounded-lg border shadow-sm bg-background p-6">
                  {schema && !jsonError ? (
                    <SchemaRenderer schema={schema} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      {jsonError ? (
                        <div className="space-y-2">
                          <p className="text-red-500 font-semibold">Invalid JSON</p>
                          <p className="text-sm">Fix the syntax error to see the preview</p>
                        </div>
                      ) : (
                        <p>Select an example to get started</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
