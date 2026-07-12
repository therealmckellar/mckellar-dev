import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://mckellar.dev',
  // Pure static. Pages build to dist/ root (Vercel outputDirectory: "dist").
  // The /api/inquiry lead-capture route is served as a standalone Vercel
  // serverless function from api/inquiry.ts (see repo root), so no server
  // adapter is required and Inquire submissions still work on Vercel.
  output: 'static',
  integrations: [
    react(),
    tailwind({
      configFile: './tailwind.config.js',
    }),
    sitemap()
  ],
});
