import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.ts',
  
  output: [
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'AwesomeComponents',
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        '@objectql/types': 'ObjectQLTypes'
      },
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],

  external: ['react', 'react-dom', '@objectql/types'],

  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist'
    }),
    postcss({
      extract: 'style.css',
      minimize: true
    })
  ]
};
