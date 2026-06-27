import React from 'react'

/** Clean professional avatar — no glow, no float animation */
const Avatar: React.FC = () => {
  return (
    <div className="avatar-wrap animate-fade-in" style={{ animationDelay: '0ms' }}>
      <span
        className="font-display font-bold text-2xl select-none"
        style={{ color: '#4F6EF7' }}
      >
        RM
      </span>
    </div>
  )
}

export default Avatar
