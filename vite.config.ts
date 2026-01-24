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
        },
        {
          src: 'icons',
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
        popup: resolve(__dirname, 'src/popup.html'),
        'github-comment-handler': resolve(__dirname, 'src/content/github-comment-handler.ts'),
        'github-stats-handler': resolve(__dirname, 'src/content/github-stats-handler.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'github-comment-handler') {
            return 'content/github-comment-handler.js';
          }
          if (chunkInfo.name === 'github-stats-handler') {
            return 'content/github-stats-handler.js';
          }
          return '[name].js';
        },
        chunkFileNames: 'content/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'popup.html') {
            return '[name][extname]';
          }
          if (assetInfo.name === 'github-comment-handler.css') {
            return 'content/[name][extname]';
          }
          if (assetInfo.name === 'github-stats-handler.css') {
            return 'content/[name][extname]';
          }
          return '[name][extname]';
        },
        inlineDynamicImports: false,
        manualChunks: undefined
      }
    },
    // Disable minification to prevent variable name conflicts
    minify: false
  }
});
