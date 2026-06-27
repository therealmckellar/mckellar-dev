import React from 'react'

export type SpokeAccent = 'blue' | 'gold' | 'teal'

export interface SpokeLinkItem {
  label: string
  href: string
  rel?: string
}

export interface SpokeCardProps {
  accent: SpokeAccent
  title: string
  badge: string
  description: string
  links: SpokeLinkItem[]
  animationDelay?: number
}

const accentMap: Record<SpokeAccent, { card: string; accentText: string; badge: string }> = {
  blue: { card: 'spoke-ai', accentText: 'spoke-ai-accent', badge: 'spoke-badge-blue' },
  gold: { card: 'spoke-mca', accentText: 'spoke-mca-accent', badge: 'spoke-badge-gold' },
  teal: { card: 'spoke-re', accentText: 'spoke-re-accent', badge: 'spoke-badge-teal' },
}

const ChevronRight: React.FC = () => (
  <svg
    className="w-3.5 h-3.5 flex-shrink-0 opacity-40"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const SpokeCard: React.FC<SpokeCardProps> = ({
  accent,
  title,
  badge,
  description,
  links,
  animationDelay = 0,
}) => {
  const { card, accentText, badge: badgeClass } = accentMap[accent]

  return (
    <div
      className={`pro-card ${card} animate-fade-in`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className={`font-display font-semibold text-[15px] leading-snug text-on-surface ${accentText}`}>
          {title}
        </h2>
        <span className={`spoke-badge ${badgeClass} flex-shrink-0 mt-0.5`}>{badge}</span>
      </div>

      {/* Description */}
      <p className="text-[13px] text-on-surface-muted leading-relaxed mb-3">
        {description}
      </p>

      {/* Divider */}
      <div className="rule mb-2" />

      {/* Links */}
      <div className="flex flex-col">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.rel ?? (link.href.startsWith('http') ? 'noopener noreferrer' : undefined)}
            id={`spoke-${link.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
            className="spoke-link group"
          >
            <ChevronRight />
            <span className="group-hover:text-on-surface transition-colors duration-150">
              {link.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default SpokeCard
