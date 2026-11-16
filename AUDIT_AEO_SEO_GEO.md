# SEO, AEO & GEO Audit Report — mckellar.dev (Richard McKellar)

**Last Verified:** 2026-11-16 (`npm run build` clean · `27` Astro routes built including `/404.html` + `/rss.xml`)  
**Scope:** Static production output (`dist/`), `src/`, `public/`, `astro.config.mjs`, and `vercel.json`

---

## Executive Summary

All P1, P2, and P3 SEO, AEO, and GEO items have been implemented and verified on the production build:

- **24/24 indexable content pages** sit inside Google display limits: **45–59 char `<title>`** and **139–159 char `<meta name="description">`**.
- **2/2 private utility routes** (`/email-logs`, `/links`) carry `<meta name="robots" content="noindex, nofollow">`, have `0` inbound public links, are excluded from `sitemap-0.xml`, and have matching `X-Robots-Tag: noindex, nofollow` headers in `vercel.json`.
- **404 Handling:** Custom on-brand `/404.html` page deployed with `noindex: true`, providing direct fallback links to core pages (`/`, `/richard-mckellar`, `/fractional-caio`, `/blog`), and properly excluded from sitemap.
- **Inquiry Capture Bugfix:** Fixed critical regular expression bug in `/api/inquiry.ts` that previously rejected valid email addresses containing the letter "s".
- **Natural Human Copy:** Replaced all leftover corporate/stiff phrasing ("mandates", "telemetry", "Sovereign Executive") with natural, grounded human verbiage across all pages and CSS files.
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
| 404 Page status | Handled via `dist/404.html` (`noindex, nofollow`, excluded from sitemap) |
| Lead capture `/api/inquiry` validation | Pass (email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) |
| Titles `<= 60` decoded chars | `24 / 24` pass (`45–59` chars) |
| Descriptions `120–160` chars | `24 / 24` pass (`139–159` chars) |
| Blog markdown word count | `518–952` words across all `13 / 13` articles |
| Visible FAQ vs. `FAQPage` JSON-LD match | `47 / 47` exact match across `10` routes |
| Broken internal links across `dist/` | `0` |
| `/rss.xml` items | `13` |
| `dist/variants/` removed | Yes (`false`) |
