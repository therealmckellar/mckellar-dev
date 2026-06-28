import React from 'react'
import ProfileHeader from './components/ProfileHeader'
import SpokeCard from './components/SpokeCard'
import SocialFooter from './components/SocialFooter'

// ─── Chevron icon ─────────────────────────────────────────────────────────────

const Chevron: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`flex-shrink-0 w-4 h-4 text-on-surface-subtle ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
  </svg>
)

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  return (
    <main className="w-full max-w-bio py-12 md:py-16 flex flex-col gap-3">

      {/* ── Hub: Profile ── */}
      <ProfileHeader />

      {/* ── Section label ── */}
      <p
        className="section-label px-0.5 animate-fade-in"
        style={{ animationDelay: '260ms' }}
      >
        Areas of Focus
      </p>

      {/* ── AI Adoption & Integration ── */}
      <SpokeCard
        accent="blue"
        title="AI Adoption & Integration"
        badge="Consulting Open"
        description="AI agent adoption and deployment, technical adoption and sales consulting, and seamless integration of custom intelligent workflows that scale."
        links={[
          { label: 'Hermes AI Agent', href: 'https://hermes.mckellar.dev', rel: 'me author noopener noreferrer' },
          { label: 'Technical Consulting', href: '#contact' },
          { label: 'AI Insights Blog', href: 'https://blog.mckellar.dev', rel: 'me author noopener noreferrer' },
        ]}
        animationDelay={320}
      />

      {/* ── Merchant Cash Advance ── */}
      <SpokeCard
        accent="gold"
        title="Merchant Cash Advance"
        badge="$100M+ Personally Funded"
        description="15+ years building and advising MCA / RBF platforms. C-suite executive formerly on the Whetstone Holdings executive team — expert in underwriting frameworks, ISO channel strategy, investor reporting, and scaling deal flow."
        links={[
          { label: 'My Commercial Funding', href: 'https://mycommercialfunding.com', rel: 'me author noopener noreferrer' },
          { label: 'Platform Advisory & Consulting', href: '#contact' },
        ]}
        animationDelay={400}
      />

      {/* ── Section label ── */}
      <p
        className="section-label px-0.5 mt-1 animate-fade-in"
        style={{ animationDelay: '480ms' }}
      >
        Ventures
      </p>

      {/* ── My Commercial Funding ── */}
      <a
        href="https://mycommercialfunding.com"
        target="_blank"
        rel="me author noopener noreferrer"
        id="link-my-commercial-funding"
        className="link-row animate-fade-in"
        style={{ animationDelay: '520ms' }}
      >
        <div className="link-row-icon">
          <span aria-hidden="true">💼</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-[14px] text-on-surface leading-snug">
            My Commercial Funding
          </p>
          <p className="text-xs text-on-surface-muted mt-0.5">
            Chief Revenue Officer · MCA Brokerage
          </p>
        </div>
        <Chevron />
      </a>

      {/* ── Primary CTA ── */}
      <a
        href="https://calendly.com/richmckellar"
        target="_blank"
        rel="noopener noreferrer"
        id="cta-schedule-call"
        className="btn-primary animate-fade-in mt-1"
        style={{ animationDelay: '580ms' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Schedule a Discovery Call
      </a>

      {/* ── Footer ── */}
      <div className="mt-4 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '640ms' }}>
        <div className="rule w-full" />
        <SocialFooter />
        <p className="text-[11px] font-mono text-on-surface-subtle text-center">
          © {new Date().getFullYear()} McKellar.dev · Morristown, NJ
        </p>
      </div>

    </main>
  )
}

export default App
