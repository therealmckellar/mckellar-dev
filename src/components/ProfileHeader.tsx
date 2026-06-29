import React from 'react'
import Avatar from './Avatar'

const credentials = [
  'Former VP & Executive Board Member at Whetstone Holdings',
  'C-Suite Executive Experience',
  '$100M+ Personally Funded MCA/RBF',
  '15+ Years MCA Advisory',
]

/** Profile hub: avatar, name, headline, credential pills */
const ProfileHeader: React.FC = () => {
  return (
    <header className="flex flex-col items-center text-center gap-5 pb-4">
      <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
        <Avatar />
      </div>

      {/* Name */}
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h1 className="font-display font-extrabold text-[36px] sm:text-[44px] leading-tight tracking-tight text-on-surface text-glow-primary">
          Richard McKellar
        </h1>

        {/* Headline — taken verbatim from LinkedIn but styled for high-end digital agency */}
        <p className="mt-3 text-sm sm:text-base text-on-surface-muted leading-relaxed max-w-xl mx-auto font-medium">
          I help businesses adopt AI workflows and agents. 
          Advising investors launching direct funders/brokerages and owners scaling MCA sales, underwriting, and tech.
        </p>

        <p className="mt-2 text-xs text-indigo-400 font-mono tracking-wider uppercase flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]"></span>
          Morristown, NJ · Available for consulting
        </p>
      </div>

      {/* Credential pills */}
      <div
        className="flex flex-wrap justify-center gap-2 max-w-2xl animate-fade-in mt-2"
        style={{ animationDelay: '200ms' }}
      >
        {credentials.map((c) => (
          <span key={c} className="cred-pill font-mono">{c}</span>
        ))}
      </div>

      {/* Rule */}
      <div
        className="rule w-full mt-2 animate-fade-in"
        style={{ animationDelay: '300ms' }}
      />
    </header>
  )
}

export default ProfileHeader
