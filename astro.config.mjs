import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://mckellar.dev',
  // Astro 7: 'static' output now also serves server API routes (e.g. /api/inquiry)
  // when run via the node standalone adapter.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    tailwind({
      configFile: './tailwind.config.js',
    }),
    sitemap(),
  ],
});
