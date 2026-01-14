import { useState, useEffect, Component, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SchemaRenderer } from '@object-ui/react';
import { DesignerContent, DesignerProvider, useDesigner } from '@object-ui/designer';
import { SchemaNode } from '@object-ui/core';
import { 
    Monitor, 
    Smartphone, 
    Tablet, 
    Undo, 
    Redo, 
    Copy, 
    Check, 
    Code2, 
    PenTool, 
    ArrowLeft, 
    Download 
} from 'lucide-react';
import '@object-ui/components';
import { examples, ExampleKey } from '../data/examples';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'code' | 'design' | 'preview';

// Error Boundary for Designer
class DesignerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 p-8 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Designer Error</h2>
          <p className="text-red-600 mb-4 max-w-lg">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Reload Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


// Wrapper component to access Designer context
const StudioToolbarContext = ({ 
  exampleTitle, 
  jsonError, 
  viewMode, 
  setViewMode, 
  onCopyJson 
}: { 
  exampleTitle: string, 
  jsonError: string | null, 
  viewMode: ViewMode, 
  setViewMode: (m: ViewMode) => void,
  onCopyJson: () => void
}) => {
  const navigate = useNavigate();
  const { canUndo, undo, canRedo, redo, schema } = useDesigner();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyJson();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const json = JSON.stringify(schema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
      <header className="h-14 border-b bg-white flex items-center px-4 justify-between flex-shrink-0 z-20 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            title="Back to Gallery"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="font-semibold text-sm text-gray-900">
              {exampleTitle}
            </h1>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${jsonError ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {jsonError ? 'Invalid JSON' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Center: View Mode Switcher */}
        <div className="flex p-1 bg-gray-100 rounded-lg absolute left-1/2 transform -translate-x-1/2">
           <button
              onClick={() => setViewMode('design')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'design' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Design
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'code' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
            </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
           {viewMode === 'design' && (
             <>
               <button 
                 onClick={undo} 
                 disabled={!canUndo}
                 className={`p-2 rounded-md transition-colors ${!canUndo ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
               >
                 <Undo className="w-4 h-4" />
               </button>
               <button 
                 onClick={redo} 
                 disabled={!canRedo}
                 className={`p-2 rounded-md transition-colors ${!canRedo ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
               >
                 <Redo className="w-4 h-4" />
               </button>
               <div className="w-px h-4 bg-gray-200 mx-1"></div>
             </>
           )}
           
           <button 
             onClick={handleExport}
             className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
             title="Export JSON"
           >
              <Download className="w-4 h-4" />
           </button>

           <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm ml-2"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
            </button>
        </div>
      </header>
  );
};

// Inner Component handles state for a specific example
const StudioEditor = ({ exampleId, initialJson }: { exampleId: ExampleKey, initialJson: string }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('design');
  // ... state setup ...
  
  // Initialize state based on props (which change on example switch)
  const [code, setCode] = useState(initialJson);
  const [schema, setSchema] = useState<SchemaNode | null>(() => {
    try {
      return JSON.parse(initialJson) as SchemaNode;
    } catch {
      return null;
    }
  });

  // Also update when props change (though key={exampleId} on parent usually handles this, double safety)
  useEffect(() => {
    setCode(initialJson);
    try {
      setSchema(JSON.parse(initialJson));
    } catch {
      // ignore
    }
  }, [initialJson]);
  
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');

  const updateCode = (newCode: string) => {
    setCode(newCode);
    try {
      const parsed = JSON.parse(newCode) as SchemaNode;
      setSchema(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handleDesignerChange = (newSchema: SchemaNode) => {
    const newCode = JSON.stringify(newSchema, null, 2);
    setCode(newCode);
    setSchema(newSchema);
  };
  
  const handleCopySchema = async () => {
     try {
       await navigator.clipboard.writeText(JSON.stringify(JSON.parse(code), null, 2));
     } catch (err) {
       console.error('Failed to copy', err);
     }
  };

  const viewportStyles: Record<ViewportSize, string> = {
    desktop: 'w-full',
    tablet: 'max-w-3xl mx-auto',
    mobile: 'max-w-md mx-auto'
  };

  return (
    <DesignerProvider initialSchema={schema || undefined} onSchemaChange={handleDesignerChange}>
      <div className="flex h-screen w-screen bg-background text-foreground flex-col">
        {/* Top Header injected into Designer Context */}
        <StudioToolbarContext 
           exampleTitle={exampleId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
           jsonError={jsonError}
           viewMode={viewMode}
           setViewMode={setViewMode}
           onCopyJson={handleCopySchema}
        />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
      {viewMode === 'design' ? (
        <div className="h-full bg-background absolute inset-0">
          <DesignerErrorBoundary>
            {/* We can render DesignerContent directly now since we are inside Provider */}
             <DesignerContent />
          </DesignerErrorBoundary>
        </div>
      ) : viewMode === 'preview' ? (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden absolute inset-0">
          <div className="border-b px-4 py-2 bg-white flex items-center justify-center shadow-sm z-10">
            {/* Viewport Size Toggles */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewportSize('desktop')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Desktop View"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewportSize('tablet')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'tablet' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Tablet View"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewportSize('mobile')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Mobile View"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-100/50">
            <div className={`${viewportStyles[viewportSize]} transition-all duration-300`}>
              <div className="rounded-xl border shadow-sm bg-background p-6 min-h-[500px] h-full ring-1 ring-black/5">
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
                      <p>Loading...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full overflow-hidden absolute inset-0">
          {/* Code Editor */}
          <div className="w-1/2 h-full border-r flex flex-col relative z-10">
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

          {/* Side Preview */}
          <div className="w-1/2 h-full flex flex-col bg-gray-50">
             <div className="flex-1 overflow-auto p-8">
                <div className="max-w-full rounded-lg border shadow-sm bg-background p-6">
                  {schema && !jsonError ? (
                    <SchemaRenderer schema={schema} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                       Invalid Schema
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </DesignerProvider>
  );
};

export const Studio = () => {
  const { id } = useParams<{ id: string }>();
  
  // Validate ID
  const exampleId = (id && id in examples) ? (id as ExampleKey) : 'dashboard';
  const initialCode = examples[exampleId];

  // Key forces remount when ID changes, resetting state completely
  return <StudioEditor key={exampleId} exampleId={exampleId} initialJson={initialCode} />;
};
