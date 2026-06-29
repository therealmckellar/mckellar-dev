import React, { useState } from 'react'
import ProfileHeader from './components/ProfileHeader'
import SpokeCard from './components/SpokeCard'
import SocialFooter from './components/SocialFooter'

// ─── Chevron icon ─────────────────────────────────────────────────────────────
const Chevron: React.FC<{ className?: string }> = ({ className = '' }) => (
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

// ─── FAQ QA Pairs (AEO/GEO & Search Engine optimized) ─────────────────────────
interface FaqItem {
  question: string
  answer: string
}

const faqData: FaqItem[] = [
  {
    question: "What consulting services does Richard McKellar provide?",
    answer: "Richard provides expert consulting through a dual Hub & Spoke system. Focus Spoke A covers AI Adoption & Integration, delivering custom intelligent agent deployments, backend workflow automation, and technical sales strategy. Focus Spoke B covers Merchant Cash Advance (MCA) advisory, helping investors launch direct funding operations or brokerages, and assisting existing MCA owners to scale sales teams, refine underwriting models, and adopt modern tech workflows."
  },
  {
    question: "What is Richard McKellar's professional background in Merchant Cash Advance (MCA)?",
    answer: "Richard has over 15 years of C-suite executive experience launching, advising, and scaling MCA direct funders and brokerage platforms. He has personally managed and funded over $100M in transaction volume and formerly served on the executive board and as VP of Whetstone Holdings (dba Everest Funding, Vader Funding, and Granite Mountain Funding). Today, he serves as Chief Revenue Officer of My Commercial Funding."
  },
  {
    question: "How does the AI Adoption consulting help businesses?",
    answer: "Richard works with businesses to audit operations and identify workflow bottlenecks. He designs and deploys custom AI workflows, integrates autonomous AI agents (such as the Hermes AI Agent framework), and sets up sales intelligence pipelines to automate lead routing and client interactions, unlocking high-velocity growth."
  },
  {
    question: "Where is Richard McKellar located and how can I book a call?",
    answer: "Richard is based in Morristown, New Jersey, and consults globally. You can schedule a direct discovery call through his integrated Calendly link, or submit a custom advisory request using the glassmorphic lead capture form at the bottom of the page."
  }
]

const App: React.FC = () => {
  // Navigation & Dropdown states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // FAQ accordion open states (tracks index of open FAQ, null if none open)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Lead Form states
  const [interest, setInterest] = useState<'ai' | 'mca' | 'both'>('both')
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

  const triggerSpokeInquiry = (spokeType: 'ai' | 'mca') => {
    setInterest(spokeType)
    const element = document.getElementById('inquire')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* ── Top Navigation Header ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#050B14]/75 backdrop-blur-xl border-b border-white/5 shadow-lg transition-all duration-300">
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
            <a 
              href="https://calendly.com/richmckellar" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 shadow-neon-primary transition-all px-4 py-2 rounded-lg ml-2"
            >
              Book Call
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden text-on-surface p-2 rounded-lg glass-button w-9 h-9 flex items-center justify-center"
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#050B14]/95 backdrop-blur-2xl border-t border-white/5 flex flex-col px-4 py-3 gap-2 shadow-2xl animate-fade-in">
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

          {/* Central CTAs row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center mt-6 px-1 animate-fade-in" style={{ animationDelay: '350ms' }}>
            <a
              href="https://calendly.com/richmckellar"
              target="_blank"
              rel="noopener noreferrer"
              id="cta-schedule-call"
              className="btn-primary flex-1 shadow-neon-primary"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Discovery Call
            </a>
            
            <a
              href="#inquire"
              className="inline-flex items-center justify-center gap-2 flex-1 py-3 px-5 rounded-xl font-semibold text-sm glass-button hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              <svg className="w-4.5 h-4.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Inquire Now
            </a>
          </div>
        </section>

        {/* ── 2. Spokes Section (Dual Offerings) ── */}
        <section id="focus" className="flex flex-col gap-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="text-center sm:text-left">
            <p className="section-label mb-2">Core Competencies</p>
            <h2 className="font-display font-extrabold text-[28px] sm:text-[34px] leading-tight text-on-surface">
              Dual-Engine Consulting Focus
            </h2>
            <p className="text-sm text-on-surface-muted mt-2 max-w-xl">
              Richard operates a high-impact Hub &amp; Spoke strategy, providing targeted advisory services for technology adoption and alternative asset finance.
            </p>
          </div>

          {/* Side-by-side or stacked Grid layout */}
          <div className="max-w-3xl mx-auto w-full mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Spoke A: AI Adoption & Integration */}
              <div className="flex flex-col">
                <SpokeCard
                  accent="blue"
                  title="AI Consulting & Workflows"
                  badge="Active Spoke"
                  description="Auditing workflows and deploying custom intelligent agent structures. Richard delivers bespoke automations, AI agent adoption strategies, and technical sales advisory to streamline operational overhead and accelerate pipelines."
                  links={[
                    { label: 'AI Agent / Business Integration (Hermes, Openclaw, Kimi Claw)', href: 'https://hermes.mckellar.dev' },
                    { label: 'AI Strategy & Insights Blog', href: 'https://blog.mckellar.dev' },
                    { label: 'View Advisory Scope Below', href: '#inquire' },
                  ]}
                  useCases={[
                    "Automated Lead Triage & Routing (Kimi Claw / Openclaw)",
                    "Custom Context-Aware Agent Deployments (Hermes Agent)",
                    "Slack/Feishu/WeCom Workflow Integration & Auditing",
                    "Technical Adoption & Salesforce AI Integration"
                  ]}
                  animationDelay={100}
                  ctaLabel="Inquire about AI Consulting"
                  onCtaClick={() => triggerSpokeInquiry('ai')}
                />
              </div>

              {/* Spoke B: Merchant Cash Advance Platforms */}
              <div className="flex flex-col">
                <SpokeCard
                  accent="gold"
                  title="MCA Launch & Scaling Advisory"
                  badge="15+ Yrs MCA Exec"
                  description="Strategic consulting for investors launching direct funding operations or brokerages, and MCA owners looking to scale salesforce output, refine underwriting frameworks, and implement modern technology integrations."
                  links={[
                    { label: 'My Commercial Funding Brokerage', href: 'https://mycommercialfunding.com' },
                    { label: 'Launch & Salesforce Scaling', href: '#inquire' },
                  ]}
                  useCases={[
                    "Direct Funder & Brokerage Setup for Investors",
                    "Salesforce Acquisition & ISO Network Scaling",
                    "Refining Underwriting & Risk Mitigation Models",
                    "Tech Stack Adoption & Automated Deal Routing Pipelines"
                  ]}
                  animationDelay={200}
                  ctaLabel="Inquire about MCA Consulting"
                  onCtaClick={() => triggerSpokeInquiry('mca')}
                />
              </div>

            </div>
          </div>
        </section>

        {/* ── 3. Ventures & Partnerships Section ── */}
        <section id="ventures" className="flex flex-col gap-5 animate-fade-in" style={{ animationDelay: '450ms' }}>
          <div>
            <p className="section-label mb-1">Key Venture</p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-on-surface">
              Affiliated Ventures
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
                Chief Revenue Officer · Premium MCA Brokerage &amp; Platform
              </p>
            </div>
            <Chevron />
          </a>
        </section>

        {/* ── 4. AEO & GEO FAQ Section (Answer Engine Optimization) ── */}
        <section id="faq" className="flex flex-col gap-6 scroll-mt-24 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="text-center sm:text-left">
            <p className="section-label mb-2">AEO / GEO Insights</p>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[32px] leading-tight text-on-surface">
              Expert Context &amp; FAQ
            </h2>
            <p className="text-sm text-on-surface-muted mt-2 max-w-xl">
              Direct, entity-rich answers about Richard McKellar's background, consulting expertise, and industry credentials, designed for search engines and generative AI agents.
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

        {/* ── 5. High-Converting Lead Capture Form ── */}
        <section id="inquire" className="scroll-mt-24 flex flex-col gap-6 animate-fade-in" style={{ animationDelay: '550ms' }}>
          <div className="text-center sm:text-left">
            <p className="section-label mb-2">Consulting Intake</p>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[32px] leading-tight text-on-surface">
              Start a Strategy Discussion
            </h2>
            <p className="text-sm text-on-surface-muted mt-2 max-w-xl">
              Specify your project details and select an advisory Spoke. Richard will review your submission and contact you within 24 hours.
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

                {/* Spoke Selection / Area of Interest */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="interest" className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-muted">Area of Interest (Spoke)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'ai', label: 'AI Consulting', icon: <BrainIcon /> },
                      { value: 'mca', label: 'MCA Advisory', icon: <FinanceIcon /> },
                      { value: 'both', label: 'Both / Strategic', icon: <span>⚡</span> }
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
                <button
                  type="submit"
                  disabled={formStatus === 'loading'}
                  className="btn-primary w-full shadow-neon-primary mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {formStatus === 'loading' ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Transmitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Transmit Strategic Inquiry</span>
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
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
            Consulting Hub for Artificial Intelligence Adoption &amp; MCA Platforms
          </p>
        </div>

      </main>
    </div>
  )
}

export default App
