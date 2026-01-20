import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';
import { docs, meta } from '@/.source';

const mdxSource = createMDXSource(docs, meta);

export const source = loader({
  baseUrl: '/docs',
  source: {
    files: mdxSource.files(),
  },
});
