import type { ReactNode } from 'react';

/**
 * Generic data source interface
 * Third-party systems can implement this to connect their own backends
 */
export interface DataSource {
  find(objectName: string, params?: any): Promise<any>;
  findOne(objectName: string, id: string, params?: any): Promise<any>;
  create(objectName: string, data: any): Promise<any>;
  update(objectName: string, id: string, data: any): Promise<any>;
  delete(objectName: string, id: string): Promise<void>;
  getMetadata?(): Promise<any>;
  [key: string]: any; // Allow additional methods
}

/**
 * Props of this package's minimal `AppShell` container: header, body and
 * footer slots, with no routing.
 *
 * Not `AppShellProps`: `@object-ui/layout` publishes that name for the props of
 * its own sidebar `AppShell`, the shell the console's `ConsoleLayout` composes,
 * which takes `navbar`, `defaultOpen`, `branding` and `rightRail` where this
 * one takes `header` and `footer`. One exported name stood for both until this
 * declaration was renamed (objectui#6349, batch 9).
 */
export interface MinimalAppShellProps {
  /** Sidebar component (optional) */
  sidebar?: ReactNode;
  /** Header component (optional) */
  header?: ReactNode;
  /** Footer component (optional) */
  footer?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Custom className */
  className?: string;
}
