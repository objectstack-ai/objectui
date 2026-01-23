'use client';

import React, { useState, useEffect } from 'react';
import { SchemaRenderer } from '@object-ui/react';
import type { SchemaNode } from '@object-ui/core';
import dynamic from 'next/dynamic';
import { ObjectUIProvider } from '@/app/components/ObjectUIProvider';
import { ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet } from 'lucide-react';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// Default example schema
const DEFAULT_SCHEMA = {
  type: "div",
  className: "space-y-4",
  children: [
    {
      type: "text",
      content: "Welcome to ObjectUI Playground",
      className: "text-2xl font-bold"
    },
    {
      type: "text",
      content: "Edit the JSON schema on the left to see live updates here."
    },
    {
      type: "card",
      className: "p-6",
      children: [
        {
          type: "text",
          content: "Quick Example",
          className: "text-xl font-semibold mb-2"
        },
        {
          type: "text",
          content: "Try changing the text or adding new components!",
          className: "mb-4"
        },
        {
          type: "button",
          variant: "default",
          label: "Click me"
        }
      ]
    }
  ]
};

// Example schemas for users to try
const EXAMPLE_SCHEMAS = {
  basic: DEFAULT_SCHEMA,
  form: {
    type: "div",
    className: "space-y-4 max-w-md",
    children: [
      {
        type: "text",
        content: "Contact Form",
        className: "text-2xl font-bold mb-4"
      },
      {
        type: "input",
        name: "name",
        placeholder: "Your name"
      },
      {
        type: "input",
        name: "email",
        inputType: "email",
        placeholder: "your@email.com"
      },
      {
        type: "textarea",
        name: "message",
        placeholder: "Your message",
        rows: 4
      },
      {
        type: "button",
        variant: "default",
        label: "Submit"
      }
    ]
  },
  dashboard: {
    type: "div",
    className: "space-y-6",
    children: [
      {
        type: "text",
        content: "Dashboard",
        className: "text-3xl font-bold"
      },
      {
        type: "grid",
        columns: 3,
        gap: 4,
        children: [
          {
            type: "card",
            className: "p-6",
            children: [
              {
                type: "text",
                content: "Total Users",
                className: "text-sm text-muted-foreground"
              },
              {
                type: "text",
                content: "1,234",
                className: "text-2xl font-bold mt-2"
              }
            ]
          },
          {
            type: "card",
            className: "p-6",
            children: [
              {
                type: "text",
                content: "Revenue",
                className: "text-sm text-muted-foreground"
              },
              {
                type: "text",
                content: "$12,345",
                className: "text-2xl font-bold mt-2"
              }
            ]
          },
          {
            type: "card",
            className: "p-6",
            children: [
              {
                type: "text",
                content: "Active Projects",
                className: "text-sm text-muted-foreground"
              },
              {
                type: "text",
                content: "42",
                className: "text-2xl font-bold mt-2"
              }
            ]
          }
        ]
      }
    ]
  },
  list: {
    type: "div",
    className: "space-y-4 max-w-2xl",
    children: [
      {
        type: "text",
        content: "Task List",
        className: "text-2xl font-bold mb-4"
      },
      {
        type: "card",
        className: "divide-y",
        children: [
          {
            type: "div",
            className: "p-4 flex items-center gap-3",
            children: [
              {
                type: "checkbox",
                name: "task1"
              },
              {
                type: "text",
                content: "Complete documentation"
              }
            ]
          },
          {
            type: "div",
            className: "p-4 flex items-center gap-3",
            children: [
              {
                type: "checkbox",
                name: "task2"
              },
              {
                type: "text",
                content: "Review pull requests"
              }
            ]
          },
          {
            type: "div",
            className: "p-4 flex items-center gap-3",
            children: [
              {
                type: "checkbox",
                name: "task3"
              },
              {
                type: "text",
                content: "Deploy to production"
              }
            ]
          }
        ]
      }
    ]
  }
};

type ViewMode = 'desktop' | 'tablet' | 'mobile';

const VIEW_MODES = {
  desktop: { width: '100%', label: 'Desktop', icon: Monitor },
  tablet: { width: '768px', label: 'Tablet', icon: Tablet },
  mobile: { width: '375px', label: 'Mobile', icon: Smartphone },
} as const;

export default function PlaygroundPage() {
  const [schema, setSchema] = useState<SchemaNode>(DEFAULT_SCHEMA);
  const [editorValue, setEditorValue] = useState(JSON.stringify(DEFAULT_SCHEMA, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] = useState<keyof typeof EXAMPLE_SCHEMAS>('basic');
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  // Load collapsed state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('playground-editor-collapsed');
      if (savedState) {
        setIsEditorCollapsed(savedState === 'true');
      }
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('playground-editor-collapsed', String(isEditorCollapsed));
    }
  }, [isEditorCollapsed]);

  // Detect system theme
  React.useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setEditorTheme(darkModeQuery.matches ? 'vs-dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setEditorTheme(e.matches ? 'vs-dark' : 'light');
    };
    
    darkModeQuery.addEventListener('change', handleChange);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    
    setEditorValue(value);
    
    try {
      const parsed = JSON.parse(value);
      setSchema(parsed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const loadExample = (exampleKey: keyof typeof EXAMPLE_SCHEMAS) => {
    const exampleSchema = EXAMPLE_SCHEMAS[exampleKey];
    setSelectedExample(exampleKey);
    setSchema(exampleSchema);
    setEditorValue(JSON.stringify(exampleSchema, null, 2));
    setError(null);
  };

  return (
    <ObjectUIProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    ObjectUI Playground
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Edit JSON schema and see live preview
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Examples:</span>
                <div className="flex gap-2">
                  {(Object.keys(EXAMPLE_SCHEMAS) as Array<keyof typeof EXAMPLE_SCHEMAS>).map((key) => (
                    <button
                      key={key}
                      onClick={() => loadExample(key)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        selectedExample === key
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow'
                      }`}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div 
            className={`border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out ${
              isEditorCollapsed ? 'w-0' : 'w-1/2'
            }`}
            style={{ overflow: isEditorCollapsed ? 'hidden' : 'visible' }}
          >
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">JSON Schema</h2>
              {error && (
                <div className="flex-1 mx-4 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 max-w-md truncate">
                  {error}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={editorValue}
                onChange={handleEditorChange}
                theme={editorTheme}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  padding: { top: 16, bottom: 16 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                }}
              />
            </div>
          </div>

          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-lg p-2 shadow-lg hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-700 group transition-all duration-300"
            style={{ 
              left: isEditorCollapsed ? '0' : 'calc(50% - 16px)',
            }}
            aria-label={isEditorCollapsed ? 'Expand editor' : 'Collapse editor'}
          >
            {isEditorCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
            )}
          </button>

          {/* Preview Panel */}
          <div className={`flex flex-col bg-slate-50 dark:bg-slate-900 transition-all duration-300 ${
            isEditorCollapsed ? 'w-full' : 'w-1/2'
          }`}>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Preview</h2>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                {(Object.keys(VIEW_MODES) as ViewMode[]).map((mode) => {
                  const ModeIcon = VIEW_MODES[mode].icon;
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        viewMode === mode
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      aria-label={`Switch to ${VIEW_MODES[mode].label} view`}
                    >
                      <ModeIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{VIEW_MODES[mode].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 flex justify-center">
              {error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-5xl">⚠️</div>
                    <div className="text-slate-600 dark:text-slate-400 font-medium">
                      Fix the JSON syntax to see preview
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="transition-all duration-300 ease-in-out"
                  style={{ 
                    width: VIEW_MODES[viewMode].width,
                    maxWidth: '100%',
                  }}
                >
                  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden ${
                    viewMode === 'mobile' ? 'min-h-[667px]' : viewMode === 'tablet' ? 'min-h-[600px]' : ''
                  }`}>
                    <div className="p-6">
                      <SchemaRenderer schema={schema} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ObjectUIProvider>
  );
}
