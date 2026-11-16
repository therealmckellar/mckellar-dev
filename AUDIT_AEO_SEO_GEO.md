# SEO, AEO & GEO Audit Report — mckellar.dev (Richard McKellar)

**Last Verified:** 2026-11-16 (`npm run build` clean · `26` Astro routes built + `/rss.xml`)  
**Scope:** Static production output (`dist/`), `src/`, `public/`, `astro.config.mjs`, and `vercel.json`

---

## Executive Summary

All P1, P2, and P3 SEO, AEO, and GEO items have been implemented and verified on the production build:

- **24/24 indexable content pages** sit inside Google display limits: **45–59 char `<title>`** and **139–159 char `<meta name="description">`**.
- **2/2 private utility routes** (`/email-logs`, `/links`) carry `<meta name="robots" content="noindex, nofollow">`, have `0` inbound public links, are excluded from `sitemap-0.xml`, and have matching `X-Robots-Tag: noindex, nofollow` headers in `vercel.json`.
- **`100%` JSON-LD & FAQ parity:** All 10 FAQ routes (47 total Q&A items) match visible `<details class="exec-faq-item">` text character-for-character against `FAQPage.mainEntity`. Every page renders one unified Schema.org `@graph` anchoring `#richard-mckellar` (`Person`) and `#organization` (`Organization` + `ProfessionalService`).
- **Content depth & RSS:** All 13 blog posts now contain **518–952 words** (4 legacy June 2026 posts expanded), publish `wordCount` and `Organization` publisher metadata in `Article` JSON-LD, and syndicate via `/rss.xml`.
- **AI Crawler & GEO Coverage:** `robots.txt` configures `*`, `Googlebot`, `Bingbot`, and 14 AI crawlers with RFC 9309 `Disallow` parity; `llms.txt` and `llms-full.txt` match current copy; `geo.region` / `ICBM` tags target Morristown, NJ (`40.7968, -74.4815`) and East Coast regions.
- **Asset & Build Hygiene:** `public/variants` was removed from `dist/`, `favicon.svg` + `favicon-48x48.png` + `apple-touch-icon.png` use the branded `RM` monogram, `InquiryModal` uses `client:idle`, and `.well-known/security.txt` includes `Expires:`.

---

## Verified Scorecard

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass (`0` errors) |
| `npx eslint` (components + `content.config.ts` + `rss.xml.ts`) | Pass (`0` warnings/errors) |
| Indexable content URLs in `dist/sitemap-0.xml` | `24` (`/` + 9 core/service pages + `/blog` + 13 articles) |
| Titles `<= 60` decoded chars | `24 / 24` pass (`45–59` chars) |
| Descriptions `120–160` chars | `24 / 24` pass (`139–159` chars) |
| Blog markdown word count | `518–952` words across all `13 / 13` articles |
| Visible FAQ vs. `FAQPage` JSON-LD match | `47 / 47` exact match across `10` routes |
| Broken internal links across `dist/` | `0` |
| `/rss.xml` items | `13` |
| `dist/variants/` removed | Yes (`false`) |
