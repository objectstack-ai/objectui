import { source } from '@/lib/source';
import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      <DocsLayout tree={source.pageTree} nav={{ title: 'Object UI' }}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
