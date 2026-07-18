import React, { useState, useEffect } from 'react'
import ProfileHeader from './components/ProfileHeader'
import SpokeCard from './components/SpokeCard'
import SocialFooter from './components/SocialFooter'
import { BlogView } from './components/BlogView'

// ─── Chevron icon ─────────────────────────────────────────────────────────────
const Chevron: React.FC<{ className?: string }> = ({ className = '' }) => (
  // ...
  <svg
    className={`flex-shrink-0 w-4 h-4 text-on-surface-subtle transition-transform duration-200 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)



const App: React.FC = () => {
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

  // Navigation & View states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'home' | 'blog' | 'ai-insights' | 'merchant-funding'>('home')

  const triggerPracticeInquiry = (practiceType: 'ai' | 'mca_lending' | 'mca_brokerage') => {
    if (practiceType === 'ai') {
      window.open('https://calendly.com/richmckellar', '_blank')
    } else {
      window.location.href = 'mailto:richard@mckellar.dev?subject=MCA Advisory Inquiry'
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* ── Top Navigation Header ── */}
      <nav 
        className="fixed top-0 w-full z-50 backdrop-blur-xl shadow-lg transition-all duration-300"
        style={{ backgroundColor: 'var(--color-nav-bg)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full">
          <button 
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} 
            className="font-display font-bold text-lg text-on-surface flex items-center gap-2.5 group cursor-pointer bg-transparent border-none text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-neon-primary transition-transform group-hover:scale-105">
              <span className="font-mono text-xs text-white font-bold">RM</span>
            </div>
            <span className="hidden sm:inline tracking-tight">Richard McKellar</span>
            <span className="sm:hidden font-mono text-sm text-indigo-400">mckellar.dev</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => setCurrentView('home')} 
              className={`text-xs font-semibold hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg cursor-pointer ${
                currentView === 'home' ? 'text-on-surface bg-white/5' : 'text-on-surface-muted'
              }`}
            >
              Expertise
            </button>
            <button 
              onClick={() => {
                setCurrentView('home');
                setTimeout(() => {
                  document.getElementById('ventures')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="text-xs font-semibold text-on-surface-muted hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg cursor-pointer"
            >
              Ventures
            </button>
            <button 
              onClick={() => setCurrentView('blog')} 
              className={`text-xs font-semibold hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg cursor-pointer ${
                currentView !== 'home' ? 'text-on-surface bg-white/5' : 'text-on-surface-muted'
              }`}
            >
              Blog
            </button>
            <a 
              href="/fractional-caio" 
              className="text-xs font-semibold text-on-surface-muted hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg no-underline"
            >
              Fractional CAIO
            </a>
            <a 
              href="mailto:richard@mckellar.dev?subject=Advisory discussion inquiry"
              className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all px-3.5 py-2 rounded-lg border border-indigo-500/20"
            >
              Inquire
            </a>
            
            {/* Theme Toggle Button (Desktop) */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-on-surface-muted hover:text-on-surface hover:bg-white/5 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer w-9 h-9 ml-1"
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
              className="text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 shadow-neon-primary transition-all px-4 py-2 rounded-lg ml-2"
            >
              Book Call
            </a>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme Toggle Button (Mobile) */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-on-surface-muted hover:text-on-surface hover:bg-white/5 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer w-9 h-9"
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
              className="text-on-surface p-2 rounded-lg glass-button w-9 h-9 flex items-center justify-center"
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
            <button 
              onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} 
              className="text-left text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none"
            >
              Expertise
            </button>
            <button 
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
                setTimeout(() => {
                  document.getElementById('ventures')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="text-left text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none"
            >
              Ventures
            </button>
            <button 
              onClick={() => { setCurrentView('blog'); setMobileMenuOpen(false); }} 
              className="text-left text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none"
            >
              Blog
            </button>
            <a 
              href="/fractional-caio" 
              className="text-left text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors no-underline"
            >
              Fractional CAIO
            </a>
            <a 
              href="mailto:richard@mckellar.dev?subject=Advisory discussion inquiry"
              className="text-left text-sm font-medium text-indigo-400 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              Inquire
            </a>
            <a 
              href="https://calendly.com/richmckellar" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-bold text-center text-white bg-gradient-to-r from-indigo-500 to-purple-600 py-3 rounded-xl shadow-neon-primary mt-2"
            >
              Book Discovery Call
            </a>
          </div>
        )}
      </nav>

      {/* ── Main Content Canvas ── */}
      <main className="w-full max-w-5xl px-4 sm:px-6 py-24 flex flex-col gap-16 sm:gap-24 relative z-10">
        
        {currentView === 'home' ? (
          <>
            {/* ── 1. Profile & Hero ── */}
            <section id="home" className="pt-8 md:pt-16 flex flex-col items-center">
              <ProfileHeader />

              {/* Central CTAs row - Shrunk, compact and inline-flex */}
              <div className="flex flex-row flex-wrap gap-3 justify-center mt-5 px-1 animate-fade-in" style={{ animationDelay: '350ms' }}>
                <a
                  href="https://calendly.com/richmckellar"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="cta-schedule-call"
                  className="btn-primary py-2 px-4 text-xs font-semibold shadow-neon-primary"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule Call
                </a>
                
                <a
                  href="mailto:richard@mckellar.dev?subject=Advisory discussion inquiry"
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg font-semibold text-xs glass-button hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Inquire
                </a>
              </div>
            </section>

            {/* ── 2. Advisory Areas Section ── */}
            <section id="focus" className="flex flex-col gap-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="text-center sm:text-left">
                <p className="section-label mb-2">Core Competencies</p>
                <h2 className="font-display font-extrabold text-[28px] sm:text-[34px] leading-tight text-on-surface">
                  Strategic Advisory Areas
                </h2>
                <p className="text-sm text-on-surface-muted mt-2 max-w-xl">
                  Richard provides targeted advisory services for technology adoption and alternative asset finance.
                </p>
              </div>

              {/* 3-column responsive layout */}
              <div className="max-w-5xl mx-auto w-full mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                  
                  {/* Practice A: AI Adoption & Integration */}
                  <div className="flex flex-col">
                    <SpokeCard
                      accent="blue"
                      title="AI Consulting & Workflows"
                      description="Auditing workflows and deploying custom intelligent agent structures. Richard delivers bespoke automations, AI adoption strategies, and technical sales advisory to streamline operational overhead and accelerate pipelines."
                      links={[
                        { label: 'Fractional Chief AI Officer', href: '/fractional-caio' },
                        { label: 'AI Agent / Business Integration', href: 'https://hermes.mckellar.dev' },
                        { label: 'AI Strategy & Insights Blog', href: '#blog', onClick: () => setCurrentView('blog') },
                        { label: 'View Advisory Scope Below', href: 'mailto:richard@mckellar.dev?subject=AI Advisory' },
                      ]}
                      useCases={[
                        "AI and Agent Adoption and Integration",
                        "Automated Lead Triage & Routing",
                        "Custom Context-Aware Agent Deployments",
                        "Slack/Feishu/WeCom Workflow Integration & Auditing"
                      ]}
                      animationDelay={100}
                      ctaLabel="Inquire about AI Consulting"
                      onCtaClick={() => triggerPracticeInquiry('ai')}
                    />
                  </div>

                  {/* Practice A2: Fractional Chief AI Officer */}
                  <div className="flex flex-col">
                    <SpokeCard
                      accent="purple"
                      title="Fractional Chief AI Officer"
                      badge="Focus"
                      description="A senior AI operator on a fractional basis. Richard builds a clear 90-day AI operating plan with governance, prioritization, and executive accountability — measurable ROI without a full-time CAIO hire."
                      links={[
                        { label: 'Explore the Fractional CAIO Practice', href: '/fractional-caio' },
                        { label: 'Schedule Executive Briefing', href: 'https://calendly.com/richmckellar' },
                        { label: 'Inquire about Fractional CAIO', href: 'mailto:richard@mckellar.dev?subject=Fractional%20Chief%20AI%20Officer' },
                      ]}
                      useCases={[
                        "Executive AI Council & governance charter",
                        "Prioritized 90-day AI operating plan",
                        "ROI measurement tied to decision gates",
                        "Workforce enablement & ownership transfer"
                      ]}
                      animationDelay={150}
                      ctaLabel="Inquire about Fractional CAIO"
                      ctaHref="https://calendly.com/richmckellar"
                    />
                  </div>

                  {/* Practice B: MCA Direct Lending */}
                  <div className="flex flex-col">
                    <SpokeCard
                      accent="gold"
                      title="MCA Direct Lending"
                      description="Strategic advisory for launching and scaling direct funding operations, refining underwriting models, establishing risk mitigation frameworks, and building syndication networks."
                      links={[
                        { label: 'My Commercial Funding', href: 'https://mycommercialfunding.com' },
                        { label: 'Starting and Scaling As A Direct Funding Company', href: 'mailto:richard@mckellar.dev?subject=Direct Lending Setup' },
                        { label: 'CRM Setup and Buildout', href: 'mailto:richard@mckellar.dev?subject=CRM Setup' },
                      ]}
                      useCases={[
                        "Starting and Scaling As A Direct Funding Company",
                        "CRM Setup and Buildout",
                        "Refining Underwriting & Risk Mitigation Models",
                        "Syndication & Capital Setup"
                      ]}
                      animationDelay={200}
                      ctaLabel="Inquire about Direct Lending"
                      onCtaClick={() => triggerPracticeInquiry('mca_lending')}
                    />
                  </div>

                  {/* Practice C: MCA Brokerage */}
                  <div className="flex flex-col">
                    <SpokeCard
                      accent="teal"
                      title="MCA Brokerage"
                      description="Advisory services focused on launching high-volume brokerages, building ISO networks, and implementing high-velocity lead-to-deal conversion processes."
                      links={[
                        { label: 'My Commercial Funding', href: 'https://mycommercialfunding.com' },
                        { label: 'CRM Setup and Buildout', href: 'mailto:richard@mckellar.dev?subject=CRM Setup' },
                      ]}
                      useCases={[
                        "Setting up a Brokerage Operation",
                        "CRM Setup and Buildout",
                        "Salesforce Acquisition & ISO Network Expansion",
                        "Lead Triage & Conversion Workflows"
                      ]}
                      animationDelay={300}
                      ctaLabel="Inquire about Brokerage Advisory"
                      onCtaClick={() => triggerPracticeInquiry('mca_brokerage')}
                    />
                  </div>

                </div>
              </div>
            </section>

            {/* ── 3. Ventures Section ── */}
            <section id="ventures" className="flex flex-col gap-5 animate-fade-in" style={{ animationDelay: '450ms' }}>
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-on-surface">
                  Current Ventures
                </h2>
              </div>

              <a
                href="https://mycommercialfunding.com"
                target="_blank"
                rel="me author noopener noreferrer"
                id="link-my-commercial-funding"
                className="link-row hover:scale-[1.005] bg-gradient-to-r from-amber-500/[0.02] to-transparent border-amber-500/10 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300"
              >
                <div className="link-row-icon bg-amber-500/10 border-amber-500/20 text-amber-500">
                  <span aria-hidden="true">💼</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm sm:text-base text-on-surface leading-snug">
                    My Commercial Funding
                  </p>
                  <p className="text-xs text-on-surface-muted mt-0.5 font-mono uppercase tracking-wider">
                    Chief Revenue Officer · Premium MCA Platform
                  </p>
                </div>
                <Chevron />
              </a>
            </section>
          </>
        ) : (
          <BlogView 
            initialCategory={currentView === 'ai-insights' ? 'ai' : currentView === 'merchant-funding' ? 'funding' : 'all'} 
            onBackToHome={() => setCurrentView('home')} 
          />
        )}

        {/* ── Footer / Copyright ── */}
        <div className="mt-8 flex flex-col items-center gap-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="rule w-full" />
          <SocialFooter />
          <p className="text-[11px] font-mono text-on-surface-subtle text-center leading-relaxed">
            © {new Date().getFullYear()} McKellar.dev · Morristown, NJ<br />
            Consulting Practice for Artificial Intelligence Adoption &amp; MCA Platforms
          </p>
        </div>

      </main>
    </div>
  )
}

export default App
