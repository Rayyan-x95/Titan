import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

const deferredPrecacheChunks = [
  /^assets\/AnswerBlock-/,
  /^assets\/BlogPage-/,
  /^assets\/BlogPost-/,
  /^assets\/ExpenseTrackerPage-/,
  /^assets\/FeaturesPage-/,
  /^assets\/InstallPage-/,
  /^assets\/LifeManagementAppPage-/,
  /^assets\/LifeTimelinePage-/,
  /^assets\/MarketingLanding-/,
  /^assets\/MarketingLayout-/,
  /^assets\/PersonalLifeOSPage-/,
  /^assets\/PrivacyPage-/,
  /^assets\/SharedExpensesPage-/,
  /^assets\/SplitExpensesAppPage-/,
  /^assets\/TaskManagerPage-/,
  /^assets\/TermsPage-/,
  /^assets\/WhatIsTitanPage-/,
  /^assets\/pdf-/,
  /^assets\/pdf\.worker\./,
];

const PORT = Number(process.env.PORT) || 8000;

export default defineConfig({
  server: {
    port: PORT,
  },
  preview: {
    port: PORT,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      manifest: false,
      injectManifest: {
        globIgnores: [
          '**/sitemap.xml',
          '**/robots.txt',
          'Opengraph.png',
          'screenshot-mobile.png',
          '**/*.png', // Exclude screenshot image assets from direct offline precache
        ],
        manifestTransforms: [
          async (entries) => ({
            manifest: entries.filter((entry) => {
              const url = entry.url.replace(/^\//, '');
              // Exclude massive images and sitemaps from the PWA precache list to make install lightweight
              if (
                url === 'Opengraph.png' ||
                url === 'screenshot-mobile.png' ||
                url.includes('screenshot') ||
                url.endsWith('.png')
              ) {
                return false;
              }
              return !deferredPrecacheChunks.some((pattern) => pattern.test(url));
            }),
          }),
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          state: ['zustand', 'dexie'],
          ui: ['framer-motion', 'lucide-react', 'react-markdown'],
          charts: ['recharts'],
          dates: ['date-fns'],
          dnd: ['@hello-pangea/dnd'],
          ocr: ['tesseract.js'],
          qr: ['qrcode', 'qrcode.react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
