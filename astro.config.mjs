import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';

const EXCLUDED_SITEMAP_PATHS = new Set(['/email-logs', '/links', '/404']);

const PILLAR_PATHS = new Set([
  '/richard-mckellar',
  '/about',
  '/ventures',
  '/case-studies',
  '/speaking-and-media',
  '/fractional-caio',
  '/fractional-fde',
  '/fractional-caio-vs-fde',
  '/institute-for-ai-adoption',
]);

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
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/+$/, '') || '/';
        if (EXCLUDED_SITEMAP_PATHS.has(pathname)) return false;
        if (pathname.startsWith('/api/')) return false;
        return true;
      },
      serialize: (item) => {
        const pathname = new URL(item.url).pathname.replace(/\/+$/, '') || '/';
        const normalizedUrl =
          pathname === '/' ? 'https://mckellar.dev/' : `https://mckellar.dev${pathname}`;

        if (pathname === '/') {
          return { ...item, url: normalizedUrl, changefreq: ChangeFreqEnum.WEEKLY, priority: 1.0 };
        }
        if (PILLAR_PATHS.has(pathname)) {
          return { ...item, url: normalizedUrl, changefreq: ChangeFreqEnum.WEEKLY, priority: 0.9 };
        }
        if (pathname === '/blog') {
          return { ...item, url: normalizedUrl, changefreq: ChangeFreqEnum.WEEKLY, priority: 0.85 };
        }
        if (pathname.startsWith('/blog/')) {
          return { ...item, url: normalizedUrl, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.8 };
        }
        return { ...item, url: normalizedUrl, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.6 };
      },
    }),
  ],
});
