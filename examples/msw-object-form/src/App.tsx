/**
 * App Component
 * 
 * Main application component demonstrating ObjectForm with MSW
 */

import { useState, useEffect } from 'react';
import { ObjectStackClient } from '@objectstack/client';
import { ObjectForm } from '@object-ui/plugin-form';
import { ObjectGrid } from '@object-ui/plugin-grid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@object-ui/components';
import { ObjectStackDataSource } from './dataSource';
import type { Contact } from './types';
import './App.css';
import { Plus, LayoutDashboard, Users, Settings } from 'lucide-react';

export function App() {
  const [client, setClient] = useState<ObjectStackClient | null>(null);
  const [dataSource, setDataSource] = useState<ObjectStackDataSource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Contact | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initializeClient();
  }, []);

  async function initializeClient() {
    try {
      // Initialize ObjectStack Client pointing to our mocked API
      const stackClient = new ObjectStackClient({
        baseUrl: ''
      });

      // Wait a bit to ensure MSW is fully ready
      await new Promise(resolve => setTimeout(resolve, 500));
      await stackClient.connect();
      
      const ds = new ObjectStackDataSource(stackClient);
      
      setClient(stackClient);
      setDataSource(ds);
      setConnected(true);
      console.log('✅ ObjectStack Client connected (via MSW)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize client');
      console.error('Failed to initialize client:', err);
    }
  }

  const handleCreate = () => {
    setEditingRecord(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setRefreshKey(k => k + 1);
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full p-8 border border-red-300 bg-red-50 rounded-lg shadow-sm text-center">
          <h1 className="text-xl font-bold text-red-800 mb-2">Connection Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={initializeClient}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!connected || !client || !dataSource) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4 bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin"></div>
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-1 text-gray-900">Connecting to ObjectStack...</h1>
          <p className="text-gray-600 text-sm">Initializing MSW and ObjectStack Client...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
       {/* Sidebar */}
       <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <span className="font-bold text-xl text-slate-800 tracking-tight">ObjectUI</span>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
             <Button variant="ghost" className="w-full justify-start font-medium" disabled>
                <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" /> Dashboard
             </Button>
             <Button variant="secondary" className="w-full justify-start font-medium text-slate-900 bg-slate-100">
                <Users className="mr-2 h-4 w-4 text-slate-700" /> Contacts
             </Button>
             <Button variant="ghost" className="w-full justify-start font-medium text-slate-600 hover:text-slate-900">
                <Settings className="mr-2 h-4 w-4 text-slate-500" /> Settings
             </Button>
          </nav>
          <div className="p-4 border-t border-slate-100">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                 <div className="text-sm">
                    <p className="font-medium text-slate-700">Admin User</p>
                    <p className="text-slate-500 text-xs">admin@example.com</p>
                 </div>
             </div>
          </div>
       </aside>

       {/* Main Content */}
       <main className="flex-1 flex flex-col min-w-0 h-full relative">
          {/* Header */}
          <header className="flex-shrink-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 w-full">
             <div>
                <h1 className="text-xl font-semibold text-slate-800">Contacts</h1>
                <p className="text-sm text-slate-500">Manage your organization's contacts</p>
             </div>
             <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
               <Plus className="mr-2 h-4 w-4" /> New Contact
             </Button>
          </header>

          {/* Table Area */}
          <div className="flex-1 overflow-hidden p-6 relative">
             <div className="rounded-xl border border-slate-200 bg-white shadow-sm h-full flex flex-col overflow-hidden">
                <ObjectGrid 
                   key={refreshKey}
                   schema={{
                      type: 'object-grid',
                      objectName: 'contact',
                      // Enable comprehensive features
                      filterable: true,
                      searchableFields: ['name', 'email', 'company'],
                      sortable: true,
                      resizable: true,
                      pagination: {
                        pageSize: 10
                      },
                      selection: {
                        type: 'multiple'
                      },
                      columns: [
                        { field: 'name', label: 'Name', width: 200, fixed: 'left' },
                        { field: 'email', label: 'Email', width: 220 },
                        { field: 'phone', label: 'Phone', width: 150 },
                        { field: 'company', label: 'Company', width: 180 },
                        { field: 'position', label: 'Position', width: 150 },
                        { field: 'department', label: 'Department', width: 150 },
                        { field: 'priority', label: 'Priority', width: 100 },
                        { field: 'salary', label: 'Salary', width: 120 },
                        { field: 'commission_rate', label: 'Commission', width: 120 },
                        { field: 'birthdate', label: 'Birthdate', width: 120 },
                        { field: 'is_active', label: 'Active', width: 100 },
                        { field: 'last_contacted', label: 'Last Contacted', width: 180 },
                        { field: 'profile_url', label: 'LinkedIn', width: 200 },
                      ]
                   }}
                   dataSource={dataSource}
                   onEdit={handleEdit}
                   onRowSelect={(selected) => console.log('Selected rows:', selected)}
                   onDelete={async (record) => {
                      if (confirm(`Are you sure you want to delete ${record.name}?`)) {
                        await dataSource?.delete('contact', record.id);
                        setRefreshKey(k => k + 1);
                      }
                   }}
                   className="h-full w-full"
                />
             </div>
          </div>
       </main>

       {/* Form Dialog */}
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-0 p-0">
             <DialogHeader className="p-6 pb-2 border-b border-slate-100">
                <DialogTitle className="text-xl">{editingRecord ? 'Edit Contact' : 'New Contact'}</DialogTitle>
                <DialogDescription>
                   {editingRecord ? 'Update contact details below.' : 'Fill in the information to create a new contact.'}
                </DialogDescription>
             </DialogHeader>
             
             <div className="p-6 pt-4 flex-1 overflow-y-auto">
               <ObjectForm
                  schema={{
                     type: 'object-form',
                     objectName: 'contact',
                     mode: editingRecord ? 'edit' : 'create',
                     recordId: editingRecord?.id,
                     fields: [
                        'name', 
                        'email', 
                        'phone', 
                        'company', 
                        'position',
                        'priority',
                        'salary',
                        'commission_rate',
                        'birthdate',
                        'last_contacted',
                        'available_time',
                        'profile_url',
                        'department',
                        'resume',
                        'avatar',
                        'is_active', 
                        'notes'
                     ],
                     layout: 'vertical',
                     columns: 2,
                     onSuccess: handleSuccess,
                     onCancel: () => setIsDialogOpen(false),
                     showSubmit: true,
                     showCancel: true,
                     submitText: editingRecord ? 'Save Changes' : 'Create Contact',
                  }}
                  dataSource={dataSource}
                  className="space-y-4"
               />
             </div>
          </DialogContent>
       </Dialog>
    </div>
  );
}
