import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      // Setup aliases for polyfills to support legacy libraries that might import Node builtins
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      url: 'url',
      assert: 'assert',
      http: 'stream-http',
      https: 'https-browserify',
      // Allow relative src imports if needed
      src: path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build', // Matches CRA's default output directory
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put node_modules in vendor chunks to optimize initial bundle size
          if (id.includes('node_modules')) {
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-antd';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@lottiefiles') || id.includes('lottie')) {
              return 'vendor-lottie';
            }
            return 'vendor';
          }
        },
      },
    },
    // Avoid bundle size warnings for chunks
    chunkSizeWarningLimit: 1000,
  },
  // Since Vite doesn't support .lottie files natively as assets out of the box,
  // we add it to assetsInclude to make sure they are treated as static assets and load as URLs.
  assetsInclude: ['**/*.lottie'],
});
