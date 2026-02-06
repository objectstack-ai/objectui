import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReportViewer, ReportBuilder } from '@object-ui/plugin-report';
import { Empty, EmptyTitle, EmptyDescription, Button } from '@object-ui/components';
import { Code2, PenLine, ChevronLeft } from 'lucide-react';
import appConfig from '../../objectstack.shared';

// Mock fields for the builder since we don't have a dynamic schema provider here yet
const MOCK_FIELDS = [
  { name: 'month', label: 'Month', type: 'string' },
  { name: 'revenue', label: 'Revenue', type: 'number' },
  { name: 'count', label: 'Count', type: 'number' },
  { name: 'region', label: 'Region', type: 'string' },
  { name: 'product', label: 'Product', type: 'string' },
  { name: 'source', label: 'Lead Source', type: 'string' },
  { name: 'stage', label: 'Stage', type: 'string' },
  { name: 'amount', label: 'Amount', type: 'currency' },
];

export function ReportView() {
  const { reportName } = useParams<{ reportName: string }>();
  const [showDebug, setShowDebug] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Find report definition in config
  // Note: we need to cast appConfig because reports might not be in the strict type yet
  const initialReport = (appConfig as any).reports?.find((r: any) => r.name === reportName);
  const [reportData, setReportData] = useState(initialReport);

  if (!initialReport) {
    return (
      <div className="h-full flex items-center justify-center p-8">
         <Empty>
          <EmptyTitle>Report Not Found</EmptyTitle>
          <EmptyDescription>The report "{reportName}" could not be found.</EmptyDescription>
        </Empty>
      </div>
    );
  }

  const handleSave = (newReport: any) => {
    console.log('Saving report:', newReport);
    setReportData(newReport);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
         <div className="flex items-center p-4 border-b bg-muted/10 gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
               <ChevronLeft className="h-4 w-4 mr-1" />
               Back to View
            </Button>
            <div className="font-medium">Edit Report: {reportData.title}</div>
         </div>
         <div className="flex-1 overflow-auto">
            <ReportBuilder 
               schema={{ 
                  title: 'Report Builder', 
                  report: reportData,
                  availableFields: MOCK_FIELDS,
                  onSave: handleSave,
                  onCancel: () => setIsEditing(false)
               }} 
            />
         </div>
      </div>
    );
  }

  // Wrap the report definition in the ReportViewer schema
  // The ReportViewer expects a schema property which is of type ReportViewerSchema
  // That schema has a 'report' property which is the actual report definition (ReportSchema)
  const viewerSchema = {
      type: 'report-viewer',
      report: reportData, // The report definition
      showToolbar: true,
      allowExport: true
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex justify-between items-center p-6 border-b shrink-0 bg-muted/10">
        <div>
           {/* Header is handled by ReportViewer usually, but we can have a page header too */}
           <h1 className="text-lg font-medium text-muted-foreground">{reportData.title || 'Report Viewer'}</h1>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <PenLine className="h-4 w-4 mr-2" />
              Edit Report
           </Button>
           <Button 
             variant={showDebug ? "secondary" : "ghost"}
             size="sm" 
             onClick={() => setShowDebug(!showDebug)} 
             className="gap-2"
           >
             <Code2 className="h-4 w-4" />
             {showDebug ? 'Hide JSON' : 'Show JSON'}
           </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-row relative">
         <div className="flex-1 overflow-auto p-8 bg-muted/5">
            <div className="max-w-5xl mx-auto shadow-sm border rounded-xl bg-background overflow-hidden min-h-[600px]">
                <ReportViewer schema={viewerSchema} />
            </div>
         </div>

         {showDebug && (
            <div className="w-[400px] border-l bg-muted/30 p-0 overflow-hidden flex flex-col shrink-0 shadow-xl z-20 transition-all">
                <div className="p-3 border-b bg-muted/50 font-semibold text-sm flex items-center justify-between">
                  <span>Metadata Inspector</span>
                  <span className="text-xs text-muted-foreground">JSON Protocol</span>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-6">
                  <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Report Configuration</h4>
                        <div className="relative rounded-md border bg-slate-950 text-slate-50 overflow-hidden">
                          <pre className="text-xs p-3 overflow-auto max-h-[800px]">
                              {JSON.stringify(reportData, null, 2)}
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
