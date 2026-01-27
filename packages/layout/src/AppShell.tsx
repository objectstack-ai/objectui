import React from 'react';
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  Sidebar
} from '@object-ui/components';
import { cn } from '@object-ui/components';

export interface AppShellProps {
  sidebar?: React.ReactNode;
  navbar?: React.ReactNode; // Top navbar content
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function AppShell({
  sidebar,
  navbar,
  children,
  className,
  defaultOpen = true,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {sidebar}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="w-px h-4 bg-border mx-2" />
          {navbar}
        </header>
        <main className={cn("flex-1 overflow-auto p-4 md:p-6", className)}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
