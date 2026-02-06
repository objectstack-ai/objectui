/**
 * Dashboard View Component
 * Renders a dashboard based on the dashboardName parameter
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardRenderer } from '@object-ui/plugin-dashboard';
import { Empty, EmptyTitle, EmptyDescription, Button } from '@object-ui/components';
import { Code2 } from 'lucide-react';
import appConfig from '../../objectstack.shared';

export function DashboardView() {
  const { dashboardName } = useParams<{ dashboardName: string }>();
  const [showDebug, setShowDebug] = useState(false);
  
  // Find dashboard definition in config
  // In a real implementation, this would fetch from the server
  const dashboard = appConfig.dashboards?.find((d: any) => d.name === dashboardName);

  if (!dashboard) {
    return (
      <div className="h-full flex items-center justify-center p-8">
         <Empty>
          <EmptyTitle>Dashboard Not Found</EmptyTitle>
          <EmptyDescription>The dashboard "{dashboardName}" could not be found.</EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex justify-between items-center p-6 border-b shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{dashboard.label || dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-muted-foreground mt-1">{dashboard.description}</p>
          )}
        </div>
        <Button 
          variant={showDebug ? "secondary" : "outline"}
          size="sm" 
          onClick={() => setShowDebug(!showDebug)} 
          className="gap-2"
        >
          <Code2 className="h-4 w-4" />
          Metadata
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-row relative">
         <div className="flex-1 overflow-auto p-6">
            <DashboardRenderer schema={dashboard} />
         </div>

         {showDebug && (
            <div className="w-[400px] border-l bg-muted/30 p-0 overflow-hidden flex flex-col shrink-0 shadow-xl z-20 transition-all">
                <div className="p-3 border-b bg-muted/50 font-semibold text-sm flex items-center justify-between">
                  <span>Metadata Inspector</span>
                  <span className="text-xs text-muted-foreground">JSON Protocol</span>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-6">
                  <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Dashboard Configuration</h4>
                        <div className="relative rounded-md border bg-slate-950 text-slate-50 overflow-hidden">
                          <pre className="text-xs p-3 overflow-auto max-h-[800px]">
                              {JSON.stringify(dashboard, null, 2)}
                          </pre>
                      </div>
                  </div>
                </div>
            </div>
          )}
      </div>
    </div>
  );
}
