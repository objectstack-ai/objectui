import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ObjectStackClient } from '@objectstack/client';
import { AppShell } from '@object-ui/layout';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@object-ui/components';
import { ObjectGrid } from '@object-ui/plugin-grid';
import { ObjectForm } from '@object-ui/plugin-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@object-ui/components';
import { ObjectStackDataSource } from './dataSource';
import { LayoutDashboard, Users, Plus, Database, CheckSquare, Activity, Briefcase, FileText } from 'lucide-react';
import appConfig from '../objectstack.config';

// Icon Map for dynamic icons
const ICONS: Record<string, any> = {
  'dashboard': LayoutDashboard,
  'users': Users,
  'user': Users,
  'check-square': CheckSquare,
  'activity': Activity,
  'briefcase': Briefcase,
  'file-text': FileText,
  'database': Database,
};

function getIcon(name?: string) {
  if (!name) return Database;
  return ICONS[name] || Database;
}

function ObjectView({ dataSource, objects, onEdit }: any) {
    const { objectName } = useParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const objectDef = objects.find((o: any) => o.name === objectName);

    if (!objectDef) return <div>Object {objectName} not found</div>;

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
             <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                 <div>
                    <h1 className="text-xl font-bold text-slate-900">{objectDef.label}</h1>
                    <p className="text-slate-500 text-sm">{objectDef.description || 'Manage your records'}</p>
                 </div>
                 <Button onClick={() => onEdit(null)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> New {objectDef.label}
                 </Button>
             </div>

             <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4">
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
                    className="h-full"
                />
             </div>
        </div>
    );
}

// Recursive Navigation Item Renderer
function NavigationItemRenderer({ item }: { item: any }) {
    const Icon = getIcon(item.icon);
    const location = useLocation();

    if (item.type === 'group') {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>{item.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {item.children?.map((child: any) => (
                            <NavigationItemRenderer key={child.id} item={child} />
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    // Default object/page items
    const href = item.type === 'object' ? `/${item.objectName}` : (item.path || '#');
    const isActive = location.pathname === href;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive}>
                <Link to={href}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function NavigationTree({ items }: { items: any[] }) {
    // If top level items are mixed (groups and non-groups), wrap non-groups in a generic group or render directly
    const hasGroups = items.some(i => i.type === 'group');

    if (hasGroups) {
        return (
            <>
                {items.map(item => <NavigationItemRenderer key={item.id} item={item} />)}
            </>
        );
    }

    // Flat list (create a default group)
    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map(item => <NavigationItemRenderer key={item.id} item={item} />)}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

function AppContent() {
  const [client, setClient] = useState<ObjectStackClient | null>(null);
  const [dataSource, setDataSource] = useState<ObjectStackDataSource | null>(null);
  
  // App Selection
  const apps = appConfig.apps || [];
  const [activeAppName, setActiveAppName] = useState<string>(apps[0]?.name || 'default');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initializeClient();
  }, []);

  async function initializeClient() {
    try {
      const stackClient = new ObjectStackClient({ baseUrl: '' });
      await new Promise(resolve => setTimeout(resolve, 500));
      await stackClient.connect();
      setClient(stackClient);
      setDataSource(new ObjectStackDataSource(stackClient));
    } catch (err) {
      console.error(err);
    }
  }

  const activeApp = apps.find((a: any) => a.name === activeAppName) || apps[0];
  const allObjects = appConfig.objects || [];
  
  // Find current object definition for Dialog
  const currentObjectDef = allObjects.find((o: any) => location.pathname === `/${o.name}`);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  if (!client || !dataSource) return <div className="flex items-center justify-center h-screen">Loading ObjectStack...</div>;
  if (!activeApp) return <div className="p-4">No Apps configured.</div>;

  return (
    <AppShell
      sidebar={
        <Sidebar collapsible="icon">
             <SidebarContent>
                 <div className="p-2 font-semibold text-xs text-slate-500 uppercase tracking-wider pl-4 mt-2">
                     {activeApp.label}
                 </div>
                 <NavigationTree items={activeApp.navigation || []} />
             </SidebarContent>
        </Sidebar>
      }
      navbar={
         <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">ObjectUI Workspace</h2>
                <select 
                    className="border rounded px-2 py-1 text-sm bg-white"
                    value={activeAppName} 
                    onChange={(e) => {
                        setActiveAppName(e.target.value);
                        navigate('/');
                    }}
                >
                    {apps.map((app: any) => (
                        <option key={app.name} value={app.name}>{app.label}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" size="sm">Help</Button>
            </div>
         </div>
      }
    >
      <Routes>
        <Route path="/" element={
            /* Redirect to first navigable object in the active app */
            <Navigate to={findFirstRoute(activeApp.navigation)} replace />
        } />
        <Route path="/:objectName" element={
            <ObjectView dataSource={dataSource} objects={allObjects} onEdit={handleEdit} />
        } />
      </Routes>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
             <DialogHeader className="p-6 pb-2 border-b border-slate-100">
                <DialogTitle>{editingRecord ? 'Edit' : 'Create'} {currentObjectDef?.label}</DialogTitle>
                <DialogDescription>Fill out the details below.</DialogDescription>
             </DialogHeader>
             <div className="flex-1 overflow-y-auto p-6">
                {currentObjectDef && (
                    <ObjectForm
                        key={editingRecord?.id || 'new'}
                        schema={{
                            type: 'object-form',
                            objectName: currentObjectDef.name,
                            mode: editingRecord ? 'edit' : 'create',
                            recordId: editingRecord?.id,
                            layout: 'vertical',
                            columns: 1,
                            fields: Array.isArray(currentObjectDef.fields) 
                                ? currentObjectDef.fields.map((f: any) => f.name)
                                : Object.keys(currentObjectDef.fields || {}),
                            onSuccess: () => { setIsDialogOpen(false); navigate(location.pathname); }, 
                            onCancel: () => setIsDialogOpen(false),
                            showSubmit: true,
                            showCancel: true,
                        }}
                        dataSource={dataSource}
                    />
                )}
             </div>
          </DialogContent>
       </Dialog>
    </AppShell>
  );
}

// Helper to find first valid route in navigation tree
function findFirstRoute(items: any[]): string {
    if (!items || items.length === 0) return '/';
    for (const item of items) {
        if (item.type === 'object') return `/${item.objectName}`;
        if (item.type === 'page') return item.path;
        if (item.type === 'group' && item.children) {
            const childRoute = findFirstRoute(item.children); // Recurse
            if (childRoute !== '/') return childRoute;
        }
    }
    return '/';
}

export function App() {
  return (
    <BrowserRouter>
        <AppContent />
    </BrowserRouter>
  );
}
