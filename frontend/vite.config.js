import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss() 
  ],
  define: {
    global: 'globalThis', 
    'process.env': '{}',

  },
   resolve: {
    alias: {
      stream: 'stream-browserify',
      util: 'util',
      buffer: 'buffer',
    },
      optimizeDeps: {
     include: ['simple-peer', 'buffer', 'stream-browserify'],
  },
  },
})
