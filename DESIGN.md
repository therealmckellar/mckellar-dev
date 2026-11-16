# mckellar.dev — Sovereign Executive Intelligence Design System

## 1. Google Stitch MCP Provenance

- **Stitch Project Title**: `mckellar.dev — Richard McKellar Sovereign Executive & AI Advisory Hub`
- **Stitch Project ID**: `1825291239854350604`
- **Design System ID**: `assets/eeffed7eee9844e39bb665e8f70cbc2c` (`Sovereign Executive Intelligence`)
- **Device Target**: `DESKTOP` (`2560px` high-DPI reference captures)

### Saved Stitch Screen Artifacts (`public/variants/stitch/`)

| Screen | Stitch Screen Resource | HTML Reference | PNG Capture | Dimensions |
| --- | --- | --- | --- | --- |
| **Screen 1 — Executive Home & Multi-Venture Command Hub** | `projects/1825291239854350604/screens/7f5665834a664cc08aeac4e09d536e57` | `public/variants/stitch/screen-1-home.html` | `public/variants/stitch/screen-1-home.png` | `2560x10474` |
| **Screen 2 — Fractional CAIO & FDE Practice & C.A.P. Model** | `projects/1825291239854350604/screens/23463c29776744d3bccfcfc46226329d` | `public/variants/stitch/screen-2-practice.html` | `public/variants/stitch/screen-2-practice.png` | `2560x10222` |
| **Screen 3 — Richard McKellar Executive Dossier & Case Studies** | `projects/1825291239854350604/screens/9826ba372712439683aaedd6f26506c9` | `public/variants/stitch/screen-3-dossier.html` | `public/variants/stitch/screen-3-dossier.png` | `2560x8396` |

---

## 2. Visual Philosophy & Aesthetic Direction

**Sovereign Executive Intelligence** pairs institutional financial credibility ($100M+ Commercial Funding & MCA origination) with bare-metal AI engineering rigor (Fractional CAIO & Forward Deployed Engineering).

- **High-Contrast Surface Architecture**: Layered obsidian surfaces (`#060E20` -> `#0B1326` -> `#131B2E` -> `#171F33` -> `#222A3D`) in dark mode, paired with crisp alabaster (`#F8FAFC` / `#FFFFFF` / `#F1F5F9`) in light mode.
- **Architectural Precision**: 1px hairline borders (`rgba(70, 69, 84, 0.45)` dark / `rgba(15, 23, 42, 0.08)` light), subtle `32px–40px` coordinate micro-grids (`.exec-grid-bg`), and precision double-ring avatar framing with Morristown telemetry coordinates (`40.7968° N // 74.4815° W`).
- **Zero Decorative Noise**: All feature/routing icons use crisp inline SVGs — zero raw UI emojis.

---

## 3. Color & Surface Tokens

### Stitch Canonical Dark Palette & CSS Custom Properties (`src/index.css`, `tailwind.config.js`)

| Role | Stitch Design Token | Production CSS Variable | Tailwind Token | Hex / Value |
| --- | --- | --- | --- | --- |
| **Lowest Canvas / Backdrop** | `surface_container_lowest` | `--color-bg` (dark) | `bg-obsidian`, `bg-bg` | `#060E20` |
| **Base Surface** | `background` / `surface` | — | `bg-obsidian-base` | `#0B1326` |
| **Elevated Card Low** | `surface_container_low` | `--color-surface` (dark) | `bg-obsidian-card`, `bg-surface` | `#131B2E` |
| **Elevated Card Container** | `surface_container` | `--color-surface-high` (dark) | `bg-obsidian-elevated`, `bg-surface-high` | `#171F33` |
| **Interactive Surface High** | `surface_container_high` | `--color-surface-hover` (dark) | `bg-obsidian-high` | `#222A3D` |
| **Light Mode Canvas** | — | `--color-bg` (light) | `bg-alabaster`, `bg-bg` | `#F8FAFC` |
| **Light Mode Card** | — | `--color-surface` (light) | `bg-surface` | `#FFFFFF` |
| **Primary Ink** | `on_surface` | `--color-on-surface` | `text-on-surface` | `#DAE2FD` (dark) / `#0F172A` (light) |
| **Secondary / Body Ink** | `on_surface_variant` | `--color-on-surface-muted` | `text-on-surface-muted` | `#C7C4D7` (dark) / `#475569` (light) |
| **Telemetry / Muted Ink** | `outline` | `--color-on-surface-subtle` | `text-on-surface-subtle` | `#908FA0` (dark) / `#64748B` (light) |
| **Primary Accent (AI / CAIO)** | `primary` / `primary_container` | `--color-primary` | `text-accent`, `text-stitch-primary` | `#6366F1` / `#C0C1FF` |
| **Institutional Gold (Capital / MCA)** | `secondary` / `secondary_container` | `--color-secondary` | `text-gold`, `text-stitch-secondary` | `#D97706` / `#FFB95F` |
| **Telemetry Emerald (Live Status / Verified)** | `tertiary` / `tertiary_container` | `--color-emerald` | `text-telemetry`, `text-stitch-tertiary` | `#10B981` / `#4EDEA3` |

---

## 4. Typography System

Loaded via Google Fonts in `src/layouts/BaseLayout.astro` and configured in `tailwind.config.js`:

- **Display / Headlines (`font-display`)**: `"Space Grotesk"`, weights `400, 500, 600, 700`
  - Hero Display (`h1`): `38px–56px`, tight tracking (`-0.025em` to `-0.03em`), line-height `1.03`
  - Section Heading (`h2`): `28px–40px`, tight tracking (`-0.015em`)
  - Card Heading (`h3`): `16px–20px`
- **Body / Prose (`font-sans`)**: `"Inter"`, weights `400, 500, 600, 700`
  - Lead Copy: `16px–18px` (`1.6` line-height)
  - Standard Body: `14px–15px` (`1.65–1.78` line-height inside `.prose` / `.prose-exec`)
- **Telemetry / Labels / Metrics (`font-mono`)**: `"JetBrains Mono"`, weights `400, 500, 600`
  - Section Eyebrows (`.section-label`, `.exec-kicker`): `10.5px–11.5px`, uppercase, `0.14em–0.16em` tracking
  - Badges (`.exec-badge`, `.spoke-badge`): `9.5px–10.5px`, uppercase pill

---

## 5. Layout Architecture & Shared Component Contracts

### Grid & Container Cadence
- Global header (`Navigation.tsx`), main canvas (`<main>` in `BaseLayout.astro`), and multi-column footer align to a unified `max-w-6xl` (`1152px`) container with `px-4 sm:px-6` horizontal padding and `gap-14 sm:gap-20` vertical rhythm.
- Dark/Light mode toggles via `document.documentElement.classList` (`dark` / `light`) persisted to `localStorage.theme` with FOUC prevention inline in `<head>`.

### Core Layout & Shared Classes (`src/index.css`)
- **Architectural Bento Cards**: `.exec-bento-card` + accent variants (`.exec-bento-card-indigo`, `.exec-bento-card-gold`, `.exec-bento-card-emerald`, `.exec-bento-card-violet`)
- **Verified Impact Strip**: `.exec-telemetry-strip` + 4-cell `.exec-telemetry-cell` (`$100M+ Funded | 15+ Yrs Leadership | 90-Day C.A.P. AI Model | 50-State Lending Platform`)
- **Badges & Eyebrows**: `.exec-badge` (+ `-indigo`, `-gold`, `-emerald`, `-violet`, `-teal`), `.exec-kicker`, `.cred-pill`, `.section-label`
- **Actions**: `.exec-btn-primary`, `.exec-btn-secondary`, `.exec-btn-gold`, `.btn-primary`, `.glass-button`
- **Accessible Static Accordions**: `.exec-faq-list` with native `<details class="exec-faq-item"><summary class="exec-faq-trigger">...</summary><div class="exec-faq-panel">...</div></details>`
- **Tables, Timelines & Markdown Prose**: `.exec-table-wrap` + `.exec-table`, `.exec-timeline` + `.exec-timeline-item`, `.prose` / `.prose-exec`
- **Background Grid**: `.exec-grid-bg` (`40px` subtle architectural coordinate lines)

### Static Astro Safety & Global Inquiry Delegation
- Static `.astro` pages MUST NOT pass inline JS closures (`onClick={() => openInquiry(...)}` or `onCtaClick`).
- Instead, inquiry buttons carry `data-inquiry-subject="..."` and optional `data-inquiry-source="..."`.
- `BaseLayout.astro` attaches a delegated `document.addEventListener('click', ...)` handler for `[data-inquiry-subject]`, stores `window.__pendingInquiry` for pre-hydration clicks, and dispatches `CustomEvent('open-inquiry', { detail })` consumed by `InquiryModal.tsx` (`client:load`).
- `SpokeCard.tsx` exposes string props `inquirySubject` and `inquirySource` (plus `SpokeLinkItem.inquirySubject` / `inquirySource`) rendered as `data-inquiry-*` attributes while keeping `onCtaClick` optional for `App.tsx`.

### Unified Schema.org `@graph` & Multi-Column Executive Directory Footer (`src/layouts/BaseLayout.astro`)
- Every page emits a single `@context: "https://schema.org"` `@graph` tying together `#richard-mckellar` (`Person`, canonical LinkedIn `https://linkedin.com/in/richardmckellar`), `#organization` (`ProfessionalService`), `#website`, `#webpage`, `#breadcrumb` (`BreadcrumbList`), plus optional `profileSchema`, `serviceSchema`, `articleSchema`, `itemListSchema`, and `faqSchema`.
- Global footer renders a 4-column directory linking all 10 official routes (`/richard-mckellar`, `/about`, `/ventures`, `/case-studies`, `/speaking-and-media`, `/fractional-caio`, `/fractional-fde`, `/fractional-caio-vs-fde`, `/institute-for-ai-adoption`, `/blog`) with clean `"Richard McKellar"` anchor text so site crawl depth stays `<= 2`.
