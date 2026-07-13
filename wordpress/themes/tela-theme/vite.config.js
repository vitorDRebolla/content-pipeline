import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/js/main.js'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (info) => {
          if (info.name && info.name.endsWith('.css')) return 'css/[name][extname]'
          return '[name][extname]'
        },
      },
    },
    cssCodeSplit: false,
  },
})
