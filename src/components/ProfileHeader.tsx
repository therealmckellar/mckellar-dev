import React from 'react'
import Avatar from './Avatar'

const credentials = [
  'Former VP and Executive Board - Whetstone Holdings (dba Everest Funding, Vader Funding, Granite Mountain Funding)',
  'C-Suite Executive Experience',
  '$100M+ Personally Funded',
  '15+ Yrs MCA',
]

/** Profile hub: avatar, name, headline, credential pills */
const ProfileHeader: React.FC = () => {
  return (
    <header className="flex flex-col items-center text-center gap-4 pb-2">
      <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
        <Avatar />
      </div>

      {/* Name */}
      <div className="animate-fade-in" style={{ animationDelay: '80ms' }}>
        <h1 className="font-display font-bold text-[34px] leading-tight tracking-tight text-on-surface">
          Richard McKellar
        </h1>

        {/* Headline — taken verbatim from LinkedIn */}
        <p className="mt-2 text-sm text-on-surface-muted leading-relaxed max-w-sm mx-auto">
          I help businesses adopt AI workflows and agents.{' '}
          Advising investors launching and scaling MCA&nbsp;/&nbsp;RBF platforms.
        </p>

        <p className="mt-1 text-xs text-on-surface-subtle font-mono tracking-wide">
          Morristown, NJ · Available for consulting
        </p>
      </div>

      {/* Credential pills */}
      <div
        className="flex flex-wrap justify-center gap-1.5 animate-fade-in"
        style={{ animationDelay: '160ms' }}
      >
        {credentials.map((c) => (
          <span key={c} className="cred-pill">{c}</span>
        ))}
      </div>

      {/* Rule */}
      <div
        className="rule w-full animate-fade-in"
        style={{ animationDelay: '220ms' }}
      />
    </header>
  )
}

export default ProfileHeader
