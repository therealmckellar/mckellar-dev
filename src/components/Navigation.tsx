import React, { useState, useEffect, useRef } from 'react'
import { openInquiry } from '../lib/inquiry'

interface NavigationProps {
  currentPath?: string
}

const ABOUT_LINKS = [
  { label: 'Richard McKellar Profile', sub: 'Overview, Experience & Credentials', href: '/richard-mckellar' },
  { label: 'Full Bio & Background', sub: '15+ Years in Lending & AI', href: '/about' },
  { label: 'Speaking & Media Kit', sub: 'Talks, Podcasts & Official Bios', href: '/speaking-and-media' },
]

const SERVICES_LINKS = [
  { label: 'Fractional CAIO', sub: '90-Day C.A.P.™ AI Roadmap', href: '/fractional-caio' },
  { label: 'Fractional FDE', sub: 'Hands-On AI Stack Builds', href: '/fractional-fde' },
  { label: 'CAIO vs FDE', sub: 'Which One Fits Your Team?', href: '/fractional-caio-vs-fde' },
  { label: 'Institute for AI Adoption', sub: 'Company & Agency AI Training', href: '/institute-for-ai-adoption' },
]

const normalizePath = (p: string): string => {
  if (!p || p === '/') return '/'
  return p.replace(/\/+$/, '') || '/'
}

const Navigation: React.FC<NavigationProps> = ({ currentPath = '/' }) => {
  const activePath = normalizePath(currentPath)

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (saved) return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<'about' | 'services' | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const isAboutActive = ['/richard-mckellar', '/about', '/speaking-and-media'].includes(activePath)
  const isServicesActive = [
    '/fractional-caio',
    '/fractional-fde',
    '/fractional-caio-vs-fde',
    '/institute-for-ai-adoption',
  ].includes(activePath)

  return (
    <nav
      ref={navRef}
      aria-label="Primary Navigation"
      className="fixed top-0 w-full z-50 backdrop-blur-xl transition-all duration-300"
      style={{ backgroundColor: 'var(--color-nav-bg)', borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 max-w-6xl mx-auto w-full gap-3">
        {/* Brand */}
        <a
          href="/"
          className="font-display font-bold text-base sm:text-lg text-on-surface flex items-center gap-2.5 group cursor-pointer no-underline text-left flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-neon-primary transition-transform group-hover:scale-105 border border-indigo-400/30">
            <span className="font-mono text-xs text-white font-bold tracking-tight">RM</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="tracking-tight text-sm sm:text-[15px] font-bold">Richard McKellar</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-on-surface-subtle hidden sm:inline mt-0.5">
              mckellar.dev
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {/* About Dropdown */}
          <div className="relative" onMouseLeave={() => setOpenMenu(null)}>
            <div className="flex items-center">
              <a
                href="/richard-mckellar"
                className={`text-xs font-semibold hover:bg-[var(--color-surface-hover)] hover:text-on-surface transition-all pl-3 pr-1.5 py-2 rounded-l-lg no-underline ${
                  isAboutActive ? 'text-on-surface bg-[var(--color-surface-hover)]' : 'text-on-surface-muted'
                }`}
              >
                About
              </a>
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === 'about' ? null : 'about'))}
                className={`text-xs font-semibold hover:bg-[var(--color-surface-hover)] hover:text-on-surface transition-all pr-2.5 pl-1 py-2 rounded-r-lg cursor-pointer bg-transparent border-0 ${
                  isAboutActive ? 'text-on-surface' : 'text-on-surface-muted'
                }`}
                aria-label="Toggle About menu"
                aria-expanded={openMenu === 'about'}
                aria-haspopup="true"
              >
                <svg className={`w-3 h-3 transition-transform ${openMenu === 'about' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {openMenu === 'about' && (
              <div
                className="absolute left-0 mt-1 w-72 rounded-xl border border-[var(--color-border-strong)] shadow-2xl py-2 z-50"
                style={{ backgroundColor: 'var(--color-dropdown-bg)' }}
              >
                {ABOUT_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenMenu(null)}
                    className={`flex flex-col gap-0.5 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors no-underline ${
                      activePath === item.href ? 'bg-[var(--color-accent-dim)]' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold text-on-surface">{item.label}</span>
                    <span className="text-[10.5px] font-mono text-on-surface-subtle">{item.sub}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Services Dropdown */}
          <div className="relative" onMouseLeave={() => setOpenMenu(null)}>
            <button
              type="button"
              onClick={() => setOpenMenu((m) => (m === 'services' ? null : 'services'))}
              className={`text-xs font-semibold hover:bg-[var(--color-surface-hover)] hover:text-on-surface transition-all px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer bg-transparent border-0 ${
                isServicesActive ? 'text-on-surface bg-[var(--color-surface-hover)]' : 'text-on-surface-muted'
              }`}
              aria-expanded={openMenu === 'services'}
              aria-haspopup="true"
            >
              Services
              <svg className={`w-3 h-3 transition-transform ${openMenu === 'services' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openMenu === 'services' && (
              <div
                className="absolute left-0 mt-1 w-72 rounded-xl border border-[var(--color-border-strong)] shadow-2xl py-2 z-50"
                style={{ backgroundColor: 'var(--color-dropdown-bg)' }}
              >
                {SERVICES_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenMenu(null)}
                    className={`flex flex-col gap-0.5 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors no-underline ${
                      activePath === item.href ? 'bg-[var(--color-accent-dim)]' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold text-on-surface">{item.label}</span>
                    <span className="text-[10.5px] font-mono text-on-surface-subtle">{item.sub}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <a
            href="/ventures"
            className={`text-xs font-semibold hover:bg-[var(--color-surface-hover)] hover:text-on-surface transition-all px-3 py-2 rounded-lg no-underline ${
              activePath === '/ventures' ? 'text-on-surface bg-[var(--color-surface-hover)]' : 'text-on-surface-muted'
            }`}
          >
            Ventures
          </a>

          <a
            href="/case-studies"
            className={`text-xs font-semibold hover:bg-[var(--color-surface-hover)] hover:text-on-surface transition-all px-3 py-2 rounded-lg no-underline ${
              activePath === '/case-studies' ? 'text-on-surface bg-[var(--color-surface-hover)]' : 'text-on-surface-muted'
            }`}
          >
            Case Studies
          </a>

          <a
            href="/blog"
            className={`text-xs font-semibold hover:bg-[var(--color-surface-hover)] hover:text-on-surface transition-all px-3 py-2 rounded-lg no-underline ${
              activePath.startsWith('/blog') ? 'text-on-surface bg-[var(--color-surface-hover)]' : 'text-on-surface-muted'
            }`}
          >
            Blog
          </a>
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => openInquiry({ subject: 'Advisory Discussion', source: 'nav-desktop' })}
            className="text-xs font-semibold text-on-surface bg-[var(--color-accent-dim)] hover:bg-indigo-500/20 transition-all px-3.5 py-2 rounded-lg border border-indigo-500/30 cursor-pointer"
          >
            Contact
          </button>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-on-surface-muted hover:text-on-surface hover:bg-[var(--color-surface-hover)] p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer w-9 h-9 bg-transparent border border-[var(--color-border)]"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <a
            href="https://calendar.mckellar.dev/richard/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="exec-btn-primary !py-2 !px-4 !text-xs no-underline"
          >
            Book a Call
          </a>
        </div>

        {/* Mobile / Tablet Controls */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => openInquiry({ subject: 'Advisory Discussion', source: 'nav-mobile-bar' })}
            className="hidden sm:inline-flex text-xs font-semibold text-on-surface bg-[var(--color-accent-dim)] px-3 py-1.5 rounded-lg border border-indigo-500/30 cursor-pointer"
          >
            Contact
          </button>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-on-surface-muted hover:text-on-surface hover:bg-[var(--color-surface-hover)] p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer w-9 h-9 bg-transparent border border-[var(--color-border)]"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-on-surface p-2 rounded-lg glass-button w-9 h-9 flex items-center justify-center"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden flex flex-col px-4 py-4 gap-3 shadow-2xl max-h-[82vh] overflow-y-auto"
          style={{ backgroundColor: 'var(--color-dropdown-bg)', borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-[0.14em] text-on-surface-subtle">
              About Richard
            </span>
            {ABOUT_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-on-surface py-2 px-3 rounded-lg hover:bg-[var(--color-surface-hover)] no-underline flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-[10px] font-mono text-on-surface-subtle">{item.href}</span>
              </a>
            ))}
          </div>

          <div className="rule" />

          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-[0.14em] text-on-surface-subtle">
              Services
            </span>
            {SERVICES_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-on-surface py-2 px-3 rounded-lg hover:bg-[var(--color-surface-hover)] no-underline"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="rule" />

          <div className="flex flex-col gap-1">
            <a href="/ventures" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-on-surface py-2 px-3 rounded-lg hover:bg-[var(--color-surface-hover)] no-underline">
              Ventures
            </a>
            <a href="/case-studies" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-on-surface py-2 px-3 rounded-lg hover:bg-[var(--color-surface-hover)] no-underline">
              Case Studies
            </a>
            <a href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-on-surface py-2 px-3 rounded-lg hover:bg-[var(--color-surface-hover)] no-underline">
              Blog
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                openInquiry({ subject: 'Advisory Discussion', source: 'nav-mobile' })
              }}
              className="exec-btn-secondary !py-2.5 !text-xs"
            >
              Contact
            </button>
            <a
              href="https://calendar.mckellar.dev/richard/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="exec-btn-primary !py-2.5 !text-xs no-underline"
            >
              Book a Call
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation
