import React, { useState, useEffect } from 'react'
import { openInquiry } from '../lib/inquiry'

interface NavigationProps {
  currentPath?: string
}

const Navigation: React.FC<NavigationProps> = ({ currentPath = '/' }) => {
  // Theme state
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

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHome = currentPath === '/' || currentPath === ''

  return (
    <nav 
      className="fixed top-0 w-full z-50 backdrop-blur-xl shadow-lg transition-all duration-300"
      style={{ backgroundColor: 'var(--color-nav-bg)', borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full">
        <a 
          href="/" 
          className="font-display font-bold text-lg text-on-surface flex items-center gap-2.5 group cursor-pointer no-underline text-left"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-neon-primary transition-transform group-hover:scale-105">
            <span className="font-mono text-xs text-white font-bold">RM</span>
          </div>
          <span className="hidden sm:inline tracking-tight">Richard McKellar</span>
          <span className="sm:hidden font-mono text-sm text-indigo-400">mckellar.dev</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <a 
            href={isHome ? '#focus' : '/#focus'} 
            className={`text-xs font-semibold hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg no-underline ${
              currentPath === '/' ? 'text-on-surface' : 'text-on-surface-muted'
            }`}
          >
            Expertise
          </a>
          <a 
            href={isHome ? '#ventures' : '/#ventures'}
            className="text-xs font-semibold text-on-surface-muted hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg no-underline"
          >
            Ventures
          </a>
          <a 
            href="/blog" 
            className={`text-xs font-semibold hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg no-underline ${
              currentPath.startsWith('/blog') ? 'text-on-surface bg-white/5' : 'text-on-surface-muted'
            }`}
          >
            Blog
          </a>
          <a 
            href="/fractional-caio" 
            className={`text-xs font-semibold hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg no-underline ${
              currentPath === '/fractional-caio' ? 'text-on-surface bg-white/5' : 'text-on-surface-muted'
            }`}
          >
            Fractional CAIO
          </a>
          <button
            type="button"
            onClick={() => openInquiry({ subject: 'Advisory Discussion', source: 'nav-desktop' })}
            className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all px-3.5 py-2 rounded-lg border border-indigo-500/20 no-underline cursor-pointer"
          >
            Inquire
          </button>
          
          {/* Theme Toggle Button (Desktop) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-on-surface-muted hover:text-on-surface hover:bg-white/5 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer w-9 h-9 ml-1 bg-transparent border-none"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <a 
            href="https://calendly.com/richmckellar" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 shadow-neon-primary transition-all px-4 py-2 rounded-lg ml-2 no-underline"
          >
            Book Call
          </a>
        </div>

        {/* Mobile Right Controls */}
        <div className="flex md:hidden items-center gap-2">
          {/* Theme Toggle Button (Mobile) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-on-surface-muted hover:text-on-surface hover:bg-white/5 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer w-9 h-9 bg-transparent border-none"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="text-on-surface p-2 rounded-lg glass-button w-9 h-9 flex items-center justify-center bg-transparent border-none"
            aria-label="Toggle Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden flex flex-col px-4 py-3 gap-2 shadow-2xl animate-fade-in"
          style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
        >
          <a 
            href={isHome ? '#focus' : '/#focus'} 
            onClick={() => setMobileMenuOpen(false)}
            className="text-left text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors no-underline"
          >
            Expertise
          </a>
          <a 
            href={isHome ? '#ventures' : '/#ventures'}
            onClick={() => setMobileMenuOpen(false)}
            className="text-left text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors no-underline"
          >
            Ventures
          </a>
          <a 
            href="/blog" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-left text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors no-underline"
          >
            Blog
          </a>
          <a 
            href="/fractional-caio" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-left text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors no-underline"
          >
            Fractional CAIO
          </a>
          <button
            type="button"
            onClick={() => openInquiry({ subject: 'Advisory Discussion', source: 'nav-mobile' })}
            className="text-left text-sm font-medium text-indigo-400 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors no-underline cursor-pointer bg-transparent border-none"
          >
            Inquire
          </button>
          <a 
            href="https://calendly.com/richmckellar" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-bold text-center text-white bg-gradient-to-r from-indigo-500 to-purple-600 py-3 rounded-xl shadow-neon-primary mt-2 no-underline"
          >
            Book Discovery Call
          </a>
        </div>
      )}
    </nav>
  )
}

export default Navigation
