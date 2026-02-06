/**
 * Page View Component
 * Renders a custom page based on the pageName parameter
 */

import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SchemaRenderer } from '@object-ui/react';
import { Empty, EmptyTitle, EmptyDescription, Button } from '@object-ui/components';
import { Code2 } from 'lucide-react';
import appConfig from '../../objectstack.shared';

export function PageView() {
  const { pageName } = useParams<{ pageName: string }>();
  const [searchParams] = useSearchParams();
  const [showDebug, setShowDebug] = useState(false);
  
  // Find page definition in config
  // In a real implementation, this would fetch from the server
  const page = appConfig.pages?.find((p: any) => p.name === pageName);

  if (!page) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Empty>
          <EmptyTitle>Page Not Found</EmptyTitle>
          <EmptyDescription>The page "{pageName}" could not be found.</EmptyDescription>
        </Empty>
      </div>
    );
  }

  // Convert URL search params to an object for the page context
  const params = Object.fromEntries(searchParams.entries());

  return (
    <div className="flex flex-row h-full w-full overflow-hidden relative">
        <div className="flex-1 overflow-auto h-full relative group">
             <div className={`absolute top-2 right-2 z-50 transition-opacity ${showDebug ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                 <Button 
                    variant="secondary" 
                    size="icon" 
                    className="shadow-md backdrop-blur-sm bg-background/50"
                    onClick={() => setShowDebug(!showDebug)} 
                    title="Toggle Metadata Inspector"
                 >
                    <Code2 className="h-4 w-4" />
                 </Button>
             </div>
             <SchemaRenderer 
                schema={{
                    type: 'page',
                    ...page,
                    context: { ...page.context, params }
                }} 
             />
        </div>
        {showDebug && (
            <div className="w-[400px] border-l bg-muted/30 p-0 overflow-hidden flex flex-col shrink-0 shadow-xl z-20 transition-all">
                <div className="p-3 border-b bg-muted/50 font-semibold text-sm flex items-center justify-between">
                  <span>Metadata Inspector</span>
                  <span className="text-xs text-muted-foreground">JSON Protocol</span>
                </div>
                <div className="flex-1 overflow-auto p-4">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Page Configuration</h4>
                        <div className="relative rounded-md border bg-slate-950 text-slate-50 overflow-hidden">
                          <pre className="text-xs p-3 overflow-auto max-h-[calc(100vh-100px)]">
                              {JSON.stringify(page, null, 2)}
                          </pre>
                      </div>
                </div>
            </div>
        )}
    </div>
  );
}
