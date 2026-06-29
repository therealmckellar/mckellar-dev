import React, { useState, useEffect } from 'react'
import ProfileHeader from './components/ProfileHeader'
import SpokeCard from './components/SpokeCard'
import SocialFooter from './components/SocialFooter'

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

// ─── SVG Icons for Premium UI ──────────────────────────────────────────────────
const BrainIcon = () => (
  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const FinanceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// ─── FAQ QA Pairs (Optimized for search engines and direct queries) ───────────────────
interface FaqItem {
  question: string
  answer: string
}

const faqData: FaqItem[] = [
  {
    question: "What consulting services does Richard McKellar provide?",
    answer: "Richard provides expert consulting across technology adoption and alternative asset finance. His practice areas include AI Adoption & Integration (delivering custom intelligent agent deployments, backend workflow automation, and technical sales strategy) and Merchant Cash Advance (MCA) advisory (assisting with direct lending operations, brokerages, CRM scaling, and underwriting workflows)."
  },
  {
    question: "What is Richard McKellar's professional background in Merchant Cash Advance (MCA)?",
    answer: "Richard has over 15 years of C-suite executive experience launching, advising, and scaling MCA direct funders and brokerage platforms. He has personally managed and funded over $100M in transaction volume and formerly served on the executive board and as VP of Whetstone Holdings (dba Everest Funding, Vader Funding, and Granite Mountain Funding). Today, he serves as Chief Revenue Officer of My Commercial Funding."
  },
  {
    question: "How does the AI Adoption consulting help businesses?",
    answer: "Richard works with businesses to audit operations and identify workflow bottlenecks. He designs and deploys custom AI workflows, integrates autonomous AI agents, and sets up sales intelligence pipelines to automate routing and client interactions, unlocking high-velocity growth."
  },
  {
    question: "Where is Richard McKellar located and how can I book a call?",
    answer: "Richard is based in Morristown, New Jersey, and consults globally. You can schedule a direct discovery call through his integrated Calendly link, or submit a custom advisory request using the contact form at the bottom of the page."
  }
]

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

  // Navigation & Dropdown states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // FAQ accordion open states (tracks index of open FAQ, null if none open)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Contact Form states
  const [interest, setInterest] = useState<'ai' | 'mca_lending' | 'mca_brokerage'>('mca_lending')
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) return

    setFormStatus('loading')
    // Mock API call to simulate transmission
    setTimeout(() => {
      setFormStatus('success')
      setFormData({ name: '', email: '', message: '' })
    }, 1200)
  }

  const triggerPracticeInquiry = (practiceType: 'ai' | 'mca_lending' | 'mca_brokerage') => {
    setInterest(practiceType)
    const element = document.getElementById('inquire')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
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
          <a href="#home" className="font-display font-bold text-lg text-on-surface flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-neon-primary transition-transform group-hover:scale-105">
              <span className="font-mono text-xs text-white font-bold">RM</span>
            </div>
            <span className="hidden sm:inline tracking-tight">Richard McKellar</span>
            <span className="sm:hidden font-mono text-sm text-indigo-400">mckellar.dev</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <a href="#focus" className="text-xs font-semibold text-on-surface-muted hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg">Expertise</a>
            <a href="#ventures" className="text-xs font-semibold text-on-surface-muted hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg">Ventures</a>
            <a href="#faq" className="text-xs font-semibold text-on-surface-muted hover:bg-white/5 hover:text-on-surface transition-all px-3.5 py-2 rounded-lg">Insights &amp; FAQ</a>
            <a href="#inquire" className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all px-3.5 py-2 rounded-lg border border-indigo-500/20">Inquire</a>
            
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
            <a 
              onClick={() => setMobileMenuOpen(false)} 
              href="#focus" 
              className="text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors"
            >
              Expertise
            </a>
            <a 
              onClick={() => setMobileMenuOpen(false)} 
              href="#ventures" 
              className="text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors"
            >
              Ventures
            </a>
            <a 
              onClick={() => setMobileMenuOpen(false)} 
              href="#faq" 
              className="text-sm font-medium text-on-surface-muted py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors"
            >
              Insights &amp; FAQ
            </a>
            <a 
              onClick={() => setMobileMenuOpen(false)} 
              href="#inquire" 
              className="text-sm font-medium text-indigo-400 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
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
        
        {/* ── 1. Hub Section (Profile & Hero) ── */}
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
              href="#inquire"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Practice A: AI Adoption & Integration */}
              <div className="flex flex-col">
                <SpokeCard
                  accent="blue"
                  title="AI Consulting & Workflows"
                  badge="Active Practice"
                  description="Auditing workflows and deploying custom intelligent agent structures. Richard delivers bespoke automations, AI adoption strategies, and technical sales advisory to streamline operational overhead and accelerate pipelines."
                  links={[
                    { label: 'AI Agent / Business Integration', href: 'https://hermes.mckellar.dev' },
                    { label: 'AI Strategy & Insights Blog', href: 'https://blog.mckellar.dev' },
                    { label: 'View Advisory Scope Below', href: '#inquire' },
                  ]}
                  useCases={[
                    "Automated Lead Triage & Routing",
                    "Custom Context-Aware Agent Deployments",
                    "Slack/Feishu/WeCom Workflow Integration & Auditing",
                    "Technical Adoption & CRM AI Integration"
                  ]}
                  animationDelay={100}
                  ctaLabel="Inquire about AI Consulting"
                  onCtaClick={() => triggerPracticeInquiry('ai')}
                />
              </div>

              {/* Practice B: MCA Direct Lending */}
              <div className="flex flex-col">
                <SpokeCard
                  accent="gold"
                  title="MCA Direct Lending"
                  badge="15+ Yrs Exec"
                  description="Strategic advisory for launching and scaling direct funding operations, refining underwriting models, establishing risk mitigation frameworks, and building syndication networks."
                  links={[
                    { label: 'My Commercial Funding', href: 'https://mycommercialfunding.com' },
                    { label: 'Open Your Own Direct Funding Company', href: '#inquire' },
                    { label: 'CRM Scaling', href: '#inquire' },
                  ]}
                  useCases={[
                    "Open Your Own Direct Funding Company",
                    "CRM Scaling",
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
                  badge="15+ Yrs Exec"
                  description="Advisory services focused on launching high-volume brokerages, building ISO networks, and implementing high-velocity lead-to-deal conversion processes."
                  links={[
                    { label: 'My Commercial Funding', href: 'https://mycommercialfunding.com' },
                    { label: 'CRM Scaling', href: '#inquire' },
                  ]}
                  useCases={[
                    "Setting up a Brokerage Operation",
                    "CRM Scaling",
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
            className="link-row hover:scale-[1.005] shadow-[0_4px_20px_rgba(0,0,0,0.15)] bg-gradient-to-r from-white/[0.02] to-transparent border-white/5 hover:border-indigo-500/25 duration-300"
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

        {/* ── 4. FAQ Section ── */}
        <section id="faq" className="flex flex-col gap-6 scroll-mt-24 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="text-center sm:text-left">
            <h2 className="font-display font-extrabold text-[26px] sm:text-[32px] leading-tight text-on-surface">
              Expert Context &amp; FAQ
            </h2>
            <p className="text-sm text-on-surface-muted mt-2 max-w-xl">
              Direct, comprehensive answers about Richard McKellar's background, credentials, and consulting expertise.
            </p>
          </div>

          {/* Accordion List */}
          <div className="flex flex-col gap-3 max-w-4xl w-full mx-auto mt-2">
            {faqData.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 border-white/5 ${
                    isOpen ? 'border-indigo-500/20 bg-white/[0.03] shadow-[0_0_20px_rgba(99,102,241,0.05)]' : ''
                  }`}
                >
                  {/* Trigger Header */}
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer select-none group"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display font-semibold text-sm sm:text-base text-on-surface group-hover:text-indigo-300 transition-colors duration-150 pr-4">
                      {faq.question}
                    </span>
                    <Chevron className={`text-indigo-400/70 group-hover:text-indigo-300 ${isOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Collapsible Content */}
                  <div className={`faq-content ${isOpen ? 'open' : ''}`}>
                    <div className="faq-inner">
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-on-surface-muted leading-relaxed border-t border-white/[0.02]">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Contact Form ── */}
        <section id="inquire" className="scroll-mt-24 flex flex-col gap-6 animate-fade-in" style={{ animationDelay: '550ms' }}>
          <div className="text-center sm:text-left">
            <p className="section-label mb-2">Contact</p>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[32px] leading-tight text-on-surface">
              Open A Line Of Communication
            </h2>
            <p className="text-sm text-on-surface-muted mt-2 max-w-xl">
              Specify your project details and select your area of interest. Richard will review your submission and contact you within 24 hours.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-w-2xl w-full mx-auto relative overflow-hidden">
            {/* Background glowing ambient points */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none"></div>

            {formStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-lg text-on-surface text-glow-primary">Inquiry Sent Successfully</h3>
                <p className="text-sm text-on-surface-muted mt-2 max-w-sm leading-relaxed">
                  Thank you for reaching out. Richard has received your request and will contact you directly to schedule an introductory call.
                </p>
                <button 
                  onClick={() => setFormStatus('idle')} 
                  className="mt-6 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-muted">Your Name</label>
                    <input 
                      type="text" 
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Jane Doe"
                      className="glass-input w-full"
                    />
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-muted">Email Address</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g., jane@company.com"
                      className="glass-input w-full"
                    />
                  </div>
                </div>

                {/* Selection / Area of Interest */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="interest" className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-muted">Area of Interest</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'ai', label: 'AI Consulting', icon: <BrainIcon /> },
                      { value: 'mca_lending', label: 'MCA Direct Lending', icon: <FinanceIcon /> },
                      { value: 'mca_brokerage', label: 'MCA Brokerage', icon: <span>💼</span> }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setInterest(opt.value as any)}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                          interest === opt.value 
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                            : 'bg-black/25 border-white/5 text-on-surface-muted hover:border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Field */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="message" className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-muted">Project Scope / Message</label>
                  <textarea 
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Describe your advisory requirements or platform constraints..."
                    className="glass-input w-full resize-none"
                  ></textarea>
                </div>

                {/* Submit button */}
                <div className="flex justify-center mt-2">
                  <button
                    type="submit"
                    disabled={formStatus === 'loading'}
                    className="btn-primary py-3 px-8 rounded-xl text-xs font-semibold shadow-neon-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {formStatus === 'loading' ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

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
