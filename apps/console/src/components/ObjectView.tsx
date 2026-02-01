import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ObjectGrid } from '@object-ui/plugin-grid';
import { Button } from '@object-ui/components';
import { Plus } from 'lucide-react';

export function ObjectView({ dataSource, objects, onEdit }: any) {
    const { objectName } = useParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const objectDef = objects.find((o: any) => o.name === objectName);

    if (!objectDef) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/30 rounded-lg border border-dashed p-8 m-4">
          <h3 className="font-semibold text-lg">Object Not Found</h3>
          <p>The object "{objectName}" does not exist in the current configuration.</p>
        </div>
      );
    }

    // Generate columns from fields if not specified
    const normalizedFields = Array.isArray(objectDef.fields) 
        ? objectDef.fields 
        : Object.entries(objectDef.fields || {}).map(([key, value]: [string, any]) => ({ name: key, ...value }));

    const columns = normalizedFields.map((f: any) => ({
        field: f.name,
        label: f.label || f.name,
        width: 150
    })).slice(0, 8); 

    return (
        <div className="h-full flex flex-col gap-4">
             {/* Header Section */}
             <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{objectDef.label}</h1>
                    <p className="text-slate-500 text-sm">{objectDef.description || 'Manage your records'}</p>
                 </div>
                 <div className="flex gap-2">
                    <Button onClick={() => onEdit(null)} className="shadow-none">
                        <Plus className="mr-2 h-4 w-4" /> New {objectDef.label}
                    </Button>
                 </div>
             </div>

             {/* Grid Section */}
             <div className="flex-1 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden p-0 relative">
                <div className="absolute inset-0">
                  <ObjectGrid
                      key={`${objectName}-${refreshKey}`}
                      schema={{
                          type: 'object-grid',
                          objectName: objectDef.name,
                          filterable: true,
                          columns: columns,
                      }}
                      dataSource={dataSource}
                      onEdit={onEdit}
                      onDelete={async (record: any) => {
                          if (confirm(`Delete record?`)) {
                              await dataSource.delete(objectName, record.id);
                              setRefreshKey(k => k + 1);
                          }
                      }}
                      className="h-full border-none"
                  />
                </div>
             </div>
        </div>
    );
}
