import React from 'react'

export type SpokeAccent = 'blue' | 'gold' | 'teal' | 'purple'

export interface SpokeLinkItem {
  label: string
  href: string
  rel?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  inquirySubject?: string
  inquirySource?: string
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
  inquirySubject?: string
  inquirySource?: string
  useCases?: string[]
}

const accentMap: Record<
  SpokeAccent,
  {
    card: string
    accentText: string
    badge: string
    shadow: string
    checkColor: string
    btnHover: string
  }
> = {
  blue: {
    card: 'spoke-ai',
    accentText: 'spoke-ai-accent',
    badge: 'spoke-badge-blue',
    shadow: 'shadow-neon-primary',
    checkColor: 'text-indigo-500 dark:text-indigo-400',
    btnHover: 'hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.18)]',
  },
  gold: {
    card: 'spoke-mca',
    accentText: 'spoke-mca-accent',
    badge: 'spoke-badge-gold',
    shadow: 'shadow-neon-gold',
    checkColor: 'text-amber-600 dark:text-amber-400',
    btnHover: 'hover:border-amber-500/50 hover:shadow-[0_0_16px_rgba(217,119,6,0.18)]',
  },
  teal: {
    card: 'spoke-re',
    accentText: 'spoke-re-accent',
    badge: 'spoke-badge-teal',
    shadow: 'shadow-neon-primary',
    checkColor: 'text-teal-600 dark:text-teal-400',
    btnHover: 'hover:border-teal-500/50 hover:shadow-[0_0_16px_rgba(20,184,166,0.18)]',
  },
  purple: {
    card: 'spoke-corp',
    accentText: 'spoke-corp-accent',
    badge: 'spoke-badge-purple',
    shadow: 'shadow-neon-secondary',
    checkColor: 'text-violet-600 dark:text-violet-400',
    btnHover: 'hover:border-violet-500/50 hover:shadow-[0_0_16px_rgba(139,92,246,0.18)]',
  },
}

const ChevronRight: React.FC = () => (
  <svg
    className="w-3.5 h-3.5 flex-shrink-0 opacity-70 text-accent group-hover:translate-x-0.5 transition-transform"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 5l7 7-7 7" />
  </svg>
)

const CheckIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 mr-2 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
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
  inquirySubject,
  inquirySource,
  useCases = [],
}) => {
  const { card: cardClass, accentText, badge: badgeClass, shadow: shadowClass, checkColor, btnHover } =
    accentMap[accent]

  const hasActionButton = Boolean(ctaLabel && (ctaHref || onCtaClick || inquirySubject))

  return (
    <div
      className={`pro-card ${cardClass} ${shadowClass} flex flex-col justify-between h-full hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className={`font-display font-bold text-[15px] sm:text-base leading-snug ${accentText}`}>
              {title}
            </h3>
            {badge && <span className={`spoke-badge ${badgeClass} flex-shrink-0 mt-0.5`}>{badge}</span>}
          </div>
          <p className="text-[12.5px] text-on-surface-muted leading-relaxed">
            {description}
          </p>
        </div>

        {useCases.length > 0 && (
          <div className="pt-1 flex flex-col gap-1.5">
            <p className="text-[9.5px] font-mono font-semibold uppercase tracking-[0.14em] text-on-surface-subtle">
              What&apos;s Included
            </p>
            <ul className="flex flex-col gap-1.5">
              {useCases.map((uc, i) => (
                <li key={i} className="flex items-start text-[11.5px] text-on-surface-muted leading-snug">
                  <CheckIcon className={checkColor} />
                  <span>{uc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rule my-1" />

        <div className="flex flex-col gap-1 mb-2">
          {links.map((link, idx) =>
            link.inquirySubject ? (
              <button
                key={idx}
                type="button"
                data-inquiry-subject={link.inquirySubject}
                data-inquiry-source={link.inquirySource || 'spoke-link'}
                className="spoke-link group w-full text-left bg-transparent border-0 cursor-pointer"
              >
                <ChevronRight />
                <span className="group-hover:text-on-surface transition-colors duration-150 font-medium text-[12px]">
                  {link.label}
                </span>
              </button>
            ) : (
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
            )
          )}
        </div>
      </div>

      {hasActionButton && (
        ctaHref ? (
          <a
            href={ctaHref}
            target={ctaHref.startsWith('http') ? '_blank' : undefined}
            rel={ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`group w-full py-2.5 px-3.5 rounded-lg text-[11.5px] font-semibold glass-button flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] no-underline ${btnHover}`}
          >
            <span>{ctaLabel}</span>
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        ) : (
          <button
            type="button"
            onClick={onCtaClick}
            data-inquiry-subject={inquirySubject}
            data-inquiry-source={inquirySource}
            className={`group w-full py-2.5 px-3.5 rounded-lg text-[11.5px] font-semibold glass-button flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${btnHover}`}
          >
            <span>{ctaLabel}</span>
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )
      )}
    </div>
  )
}

export default SpokeCard
