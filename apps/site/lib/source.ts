import { loader } from 'fumadocs-core/source';
import { docs } from '@/.source';

// Map the docs from .source to the format expected by loader
const mappedDocs = docs
  .filter((doc: any) => doc && doc.info && doc.info.path)
  .map((doc: any) => {
    let path = doc.info.path.replace(/\.mdx?$/, '');
    // Convert index.mdx to empty path
    if (path === 'index') path = '';
    
    return {
      type: 'page' as const,
      path,
      data: {
        ...doc.data,
        body: doc.data.default,
      },
    };
  });

export const source = loader({
  baseUrl: '/docs',
  source: {
    files: mappedDocs,
  },
});
