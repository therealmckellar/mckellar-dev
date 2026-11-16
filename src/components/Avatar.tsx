import React from 'react'

export interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-14 h-14',
  md: 'w-24 h-24',
  lg: 'w-28 h-28 sm:w-32 sm:h-32',
  xl: 'w-32 h-32 sm:w-36 sm:h-36',
}

/** Profile portrait avatar */
const Avatar: React.FC<AvatarProps> = ({ size = 'lg', className = '' }) => {
  return (
    <div
      className={`relative rounded-full p-[2.5px] bg-gradient-to-br from-indigo-500 via-indigo-400/70 to-amber-500/80 shadow-neon-primary transition-transform duration-300 hover:scale-[1.03] flex-shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <div className="w-full h-full rounded-full bg-[var(--color-bg)] p-[2px] overflow-hidden">
        <img
          src="/avatar.jpg"
          alt="Richard McKellar — Fractional Chief AI Officer and Commercial Funding Advisor in Morristown, NJ"
          width={144}
          height={144}
          className="w-full h-full rounded-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
      <span
        className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--color-bg)] shadow-[0_0_10px_rgba(16,185,129,0.65)]"
        title="Available for consulting"
        aria-hidden="true"
      />
    </div>
  )
}

export default Avatar
