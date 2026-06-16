import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WMTSCapabilities',
      formats: ['es', 'umd'],
      fileName: (format, entryName) => {
        if (format === 'umd') return 'wmts-capabilities.umd.cjs';
        return 'wmts-capabilities.js';
      },
    },
    sourcemap: false,
    minify: "terser"
  }
});
