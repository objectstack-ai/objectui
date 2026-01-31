/**
 * MSW Debug Panel for Storybook
 * 
 * Provides a debug UI for inspecting MSW requests, responses, and ObjectStack kernel state.
 */

import React, { useState, useEffect } from 'react';
import { kernel } from './msw-browser';

interface RequestLog {
  id: string;
  method: string;
  url: string;
  timestamp: Date;
  status?: number;
  duration?: number;
  request?: any;
  response?: any;
}

const requestLogs: RequestLog[] = [];

/**
 * Intercept and log MSW requests
 */
export function logMSWRequest(method: string, url: string, data?: any) {
  const log: RequestLog = {
    id: `${Date.now()}-${Math.random()}`,
    method,
    url,
    timestamp: new Date(),
    request: data,
  };
  requestLogs.push(log);
  
  // Keep only last 100 requests
  if (requestLogs.length > 100) {
    requestLogs.shift();
  }

  console.log(`[MSW] ${method} ${url}`, data);
  return log.id;
}

export function logMSWResponse(requestId: string, status: number, data: any, duration: number) {
  const log = requestLogs.find(l => l.id === requestId);
  if (log) {
    log.status = status;
    log.response = data;
    log.duration = duration;
  }
  console.log(`[MSW] Response ${status} (${duration}ms)`, data);
}

/**
 * MSW Debug Panel Component
 */
export function MSWDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'kernel' | 'data'>('requests');
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs([...requestLogs]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-50"
      >
        🐛 MSW Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-[600px] h-[400px] bg-white border-t-2 border-blue-600 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐛</span>
          <h3 className="font-semibold">MSW Debug Panel</h3>
          <span className="text-xs bg-blue-700 px-2 py-1 rounded">
            {logs.length} requests
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-blue-700 px-2 py-1 rounded"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Requests
        </button>
        <button
          onClick={() => setActiveTab('kernel')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'kernel'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Kernel State
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'data'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Mock Data
        </button>
        <button
          onClick={() => {
            requestLogs.length = 0;
            setLogs([]);
            setSelectedLog(null);
          }}
          className="ml-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Clear
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'requests' && (
          <div className="flex h-full">
            {/* Request list */}
            <div className="w-1/2 border-r overflow-auto">
              {logs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No requests yet
                </div>
              ) : (
                logs.reverse().map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedLog?.id === log.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono px-2 py-1 rounded ${
                          log.method === 'GET'
                            ? 'bg-green-100 text-green-800'
                            : log.method === 'POST'
                            ? 'bg-blue-100 text-blue-800'
                            : log.method === 'PUT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.method}
                      </span>
                      {log.status && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            log.status < 300
                              ? 'bg-green-100 text-green-800'
                              : log.status < 400
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      )}
                      {log.duration && (
                        <span className="text-xs text-gray-500">
                          {log.duration}ms
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-mono mt-1 truncate">
                      {log.url}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Request details */}
            <div className="w-1/2 overflow-auto p-4">
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Request</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedLog.request || {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Response</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedLog.response || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  Select a request to view details
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'kernel' && (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Kernel Status</h4>
              <div className="bg-gray-100 p-3 rounded">
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <span className="text-green-600">
                    {kernel ? '✓ Running' : '✗ Not Started'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Configuration</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(
                  {
                    baseUrl: '/api/v1',
                    driver: 'InMemoryDriver',
                    plugins: ['ObjectQL', 'MSW', 'App'],
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-4">
              Available mock data collections:
            </div>
            <div className="space-y-2">
              {[
                { name: 'contacts', count: 50 },
                { name: 'tasks', count: 100 },
                { name: 'users', count: 20 },
                { name: 'kanbanCards', count: 30 },
                { name: 'calendarEvents', count: 20 },
              ].map((collection) => (
                <div
                  key={collection.name}
                  className="bg-gray-100 p-3 rounded flex justify-between items-center"
                >
                  <span className="font-mono text-sm">{collection.name}</span>
                  <span className="text-xs text-gray-600">
                    {collection.count} items
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Decorator to add debug panel to all stories
 */
export const withMSWDebug = (Story: any) => (
  <>
    <Story />
    <MSWDebugPanel />
  </>
);
