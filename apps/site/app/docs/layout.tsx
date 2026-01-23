import { source } from '@/lib/source';
import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { Logo } from '../components/Logo';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout 
      tree={source.pageTree} 
      nav={{ title: <Logo />, url: '/' }}
      links={[
        {
          text: 'Guide',
          url: '/docs/guide',
          active: 'nested-url',
        },
        {
          text: 'Components',
          url: '/docs/components',
          active: 'nested-url',
        },
        {
          text: 'Ecosystem',
          url: '/docs/ecosystem',
          active: 'nested-url',
        },
        {
          text: 'Blog',
          url: '/blog',
          active: 'nested-url',
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
