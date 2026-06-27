import React from 'react'

export interface LinkButtonProps {
  /** Emoji or icon string shown on the left */
  icon: string
  /** Primary label for the button */
  label: string
  /** Optional sub-label / description */
  description?: string
  /** Target URL – use '#' as placeholder */
  href: string
  /** Delay multiplier for staggered animation (0-based index) */
  animationDelay?: number
  /** Optional rel attribute — use 'me author' for owned properties */
  rel?: string
}

/**
 * LinkButton – a reusable glassmorphism pill button for the link-in-bio layout.
 * Swap `href`, `label`, and `icon` props to customise each link.
 */
const LinkButton: React.FC<LinkButtonProps> = ({
  icon,
  label,
  description,
  href,
  animationDelay = 0,
  rel,
}) => {
  const defaultRel = href.startsWith('http') ? 'noopener noreferrer' : undefined
  const resolvedRel = rel ?? defaultRel

  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={resolvedRel}
      id={`link-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
      className="group relative block w-full glass glass-hover rounded-full px-6 py-4 text-left cursor-pointer no-underline animate-fade-in-up"
      style={{ animationDelay: `${animationDelay * 120}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <span
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center glass rounded-full text-xl group-hover:scale-110 transition-transform duration-300"
          aria-hidden="true"
        >
          {icon}
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-base text-on-surface leading-tight">
            {label}
          </p>
          {description && (
            <p className="font-mono text-xs text-on-surface-muted mt-0.5 tracking-wide uppercase">
              {description}
            </p>
          )}
        </div>

        {/* Chevron */}
        <svg
          className="flex-shrink-0 w-4 h-4 text-on-surface-muted group-hover:text-primary-light group-hover:translate-x-1 transition-all duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  )
}

export default LinkButton
