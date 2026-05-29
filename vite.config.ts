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

export default defineConfig({
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
        globIgnores: ['**/sitemap.xml', '**/robots.txt'],
        manifestTransforms: [
          async (entries) => ({
            manifest: entries.filter((entry) => {
              const url = entry.url.replace(/^\//, '');
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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          state: ['zustand', 'dexie'],
          ui: ['framer-motion', 'lucide-react', 'react-markdown'],
          charts: ['recharts'],
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
