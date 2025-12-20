import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        }
      ]
    }),
    {
      name: 'move-popup-html',
      closeBundle() {
        const fs = require('fs');
        const path = require('path');
        const srcPath = path.resolve(__dirname, 'dist/src/popup.html');
        const destPath = path.resolve(__dirname, 'dist/popup.html');
        if (fs.existsSync(srcPath)) {
          fs.renameSync(srcPath, destPath);
          const srcDir = path.resolve(__dirname, 'dist/src');
          if (fs.existsSync(srcDir) && fs.readdirSync(srcDir).length === 0) {
            fs.rmdirSync(srcDir);
          }
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'popup.html') {
            return '[name][extname]';
          }
          return '[name][extname]';
        }
      }
    }
  }
});
