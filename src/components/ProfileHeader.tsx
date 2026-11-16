import React from 'react'
import Avatar from './Avatar'

export interface ProfileHeaderProps {
  variant?: 'asymmetric' | 'centered'
  eyebrow?: string
  title?: string
  headline?: string
  subheadline?: string
  location?: string
  credentials?: string[]
  showRule?: boolean
}

const DEFAULT_CREDENTIALS = [
  'CRO · My Commercial Funding',
  'Founder · Institute for AI Adoption',
  'Former VP & Board · Whetstone Holdings',
  '$100M+ Funded (MCA/RBF)',
  '15+ Yrs in Alternative Finance',
]

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  variant = 'asymmetric',
  eyebrow = 'Morristown, NJ · Available for Consulting',
  title = 'Richard McKellar',
  headline = 'Fractional Chief AI Officer, Forward Deployed Engineer & Commercial Funding Advisor.',
  subheadline = 'I help companies get real AI workflows into production in 90 days—and advise founders, brokers, and lenders on building and scaling direct funding platforms.',
  location = 'Morristown, NJ · Working across NJ, NYC, FL, CT, MA, MD & Remote',
  credentials = DEFAULT_CREDENTIALS,
  showRule = true,
}) => {
  if (variant === 'centered') {
    return (
      <header className="flex flex-col items-center text-center gap-5 pb-4 w-full">
        <Avatar size="lg" />
        <div>
          <p className="exec-kicker justify-center mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="font-display font-bold text-[36px] sm:text-[48px] leading-[1.06] tracking-tight text-on-surface text-glow-primary">
            {title}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-on-surface font-medium max-w-2xl mx-auto leading-snug">
            {headline}
          </p>
          <p className="mt-2.5 text-sm text-on-surface-muted leading-relaxed max-w-2xl mx-auto">
            {subheadline}
          </p>
          <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.14em] text-on-surface-subtle">
            {location}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mt-1">
          {credentials.map((c) => (
            <span key={c} className="cred-pill font-mono">{c}</span>
          ))}
        </div>
        {showRule && <div className="rule w-full mt-2" />}
      </header>
    )
  }

  return (
    <header className="w-full flex flex-col gap-6">
      <div className="exec-bento-card exec-grid-bg overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col-reverse md:flex-row items-center md:items-start justify-between gap-8">
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-emerald-dim)] border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" aria-hidden="true" />
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                {location}
              </span>
            </div>

            <h1 className="font-display font-bold text-[38px] sm:text-[50px] lg:text-[56px] leading-[1.03] tracking-tight text-on-surface text-glow-primary">
              {title}
            </h1>

            <p className="text-base sm:text-xl text-on-surface font-medium leading-snug max-w-2xl">
              {headline}
            </p>

            <p className="text-sm sm:text-[15px] text-on-surface-muted leading-relaxed max-w-2xl">
              {subheadline}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
              {credentials.map((c) => (
                <span key={c} className="cred-pill font-mono">{c}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative p-2 rounded-full border border-indigo-400/30 bg-[var(--color-surface)]/70 backdrop-blur-md">
              <div className="p-1.5 rounded-full border border-[var(--color-border-strong)]">
                <Avatar size="xl" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-subtle">
                Morristown, NJ · mckellar.dev
              </p>
              <p className="font-mono text-[11px] font-semibold text-on-surface mt-0.5">
                @therealmckellar
              </p>
            </div>
          </div>
        </div>
      </div>
      {showRule && <div className="rule w-full" />}
    </header>
  )
}

export default ProfileHeader
