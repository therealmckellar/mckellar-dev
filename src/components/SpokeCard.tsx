import React from 'react'

export type SpokeAccent = 'blue' | 'gold' | 'teal' | 'purple'

export interface SpokeLinkItem {
  label: string
  href: string
  rel?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export interface SpokeCardProps {
  accent: SpokeAccent
  title: string
  badge?: string
  description: string
  links: SpokeLinkItem[]
  animationDelay?: number
  ctaLabel?: string
  onCtaClick?: () => void
  ctaHref?: string
  useCases?: string[]
}

const accentMap: Record<SpokeAccent, { card: string; accentText: string; badge: string; shadow: string; checkColor: string }> = {
  blue: { card: 'spoke-ai', accentText: 'spoke-ai-accent text-glow-primary', badge: 'spoke-badge-blue', shadow: 'shadow-neon-primary', checkColor: 'text-indigo-400' },
  gold: { card: 'spoke-mca', accentText: 'spoke-mca-accent text-glow-secondary', badge: 'spoke-badge-gold', shadow: 'shadow-neon-gold', checkColor: 'text-amber-400' },
  teal: { card: 'spoke-re', accentText: 'spoke-re-accent', badge: 'spoke-badge-teal', shadow: 'shadow-neon-primary', checkColor: 'text-teal-400' },
  purple: { card: 'spoke-corp', accentText: 'spoke-corp-accent text-glow-primary', badge: 'spoke-badge-purple', shadow: 'shadow-neon-primary', checkColor: 'text-purple-400' },
}

const ChevronRight: React.FC = () => (
  <svg
    className="w-3.5 h-3.5 flex-shrink-0 opacity-60 text-indigo-400 group-hover:translate-x-0.5 transition-transform"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
)

const CheckIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 mr-2 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const SpokeCard: React.FC<SpokeCardProps> = ({
  accent,
  title,
  badge,
  description,
  links,
  animationDelay = 0,
  ctaLabel,
  onCtaClick,
  ctaHref,
  useCases = [],
}) => {
  const { card: cardClass, accentText, badge: badgeClass, shadow: shadowClass, checkColor } = accentMap[accent]

  return (
    <div
      className={`pro-card ${cardClass} ${shadowClass} flex flex-col justify-between h-full bg-gradient-to-b from-white/[0.03] to-transparent hover:scale-[1.01] transition-all duration-300 animate-fade-in-up`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex flex-col gap-3">
        {/* Title & Badge */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <h3 className={`font-display font-bold text-[14px] sm:text-[15px] leading-snug text-on-surface ${accentText}`}>
              {title}
            </h3>
            {badge && <span className={`spoke-badge ${badgeClass} flex-shrink-0 mt-0.5`}>{badge}</span>}
          </div>
          <p className="text-[12px] text-on-surface-muted leading-relaxed mb-3">
            {description}
          </p>
        </div>

        {/* Use Cases Checklist */}
        {useCases.length > 0 && (
          <div className="mb-3.5 flex flex-col gap-1.5">
            <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-on-surface-subtle">
              Key Focus Areas
            </p>
            <ul className="flex flex-col gap-1">
              {useCases.map((uc, i) => (
                <li key={i} className="flex items-start text-[11px] text-on-surface-muted leading-relaxed">
                  <CheckIcon className={checkColor} />
                  <span>{uc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rule mb-2.5"></div>

        {/* Nested Links */}
        <div className="flex flex-col gap-1 mb-3.5">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              onClick={link.onClick}
              id={`spoke-${link.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
              className="spoke-link group"
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.rel ?? (link.href.startsWith('http') ? 'noopener noreferrer' : undefined)}
            >
              <ChevronRight />
              <span className="group-hover:text-on-surface transition-colors duration-150 font-medium text-[12px]">
                {link.label}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Spoke CTA Button */}
      {ctaLabel && (ctaHref || onCtaClick) && (
        ctaHref ? (
          <a
            href={ctaHref}
            target={ctaHref.startsWith('http') ? '_blank' : undefined}
            rel={ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`w-full py-2 px-3.5 rounded-lg text-[11px] font-semibold glass-button flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all active:scale-[0.98] no-underline ${
              accent === 'blue' 
                ? 'hover:border-indigo-500/50 hover:shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                : accent === 'purple'
                ? 'hover:border-purple-500/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                : accent === 'teal'
                ? 'hover:border-teal-500/50 hover:shadow-[0_0_10px_rgba(20,184,166,0.15)]'
                : 'hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]'
            }`}
          >
            <span>{ctaLabel}</span>
            <svg className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        ) : (
          <button
            onClick={onCtaClick}
            className={`w-full py-2 px-3.5 rounded-lg text-[11px] font-semibold glass-button flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all active:scale-[0.98] ${
              accent === 'blue' 
                ? 'hover:border-indigo-500/50 hover:shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                : accent === 'purple'
                ? 'hover:border-purple-500/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                : accent === 'teal'
                ? 'hover:border-teal-500/50 hover:shadow-[0_0_10px_rgba(20,184,166,0.15)]'
                : 'hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]'
            }`}
          >
            <span>{ctaLabel}</span>
            <svg className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )
      )}
    </div>
  )
}

export default SpokeCard
