import React from 'react'

/** Clean professional avatar with user uploaded portrait image */
const Avatar: React.FC = () => {
  return (
    <div 
      className="avatar-wrap overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 shadow-neon-primary hover:scale-105 transition-transform duration-300 animate-fade-in" 
      style={{ animationDelay: '0ms' }}
    >
      <div className="w-full h-full rounded-full bg-[var(--color-bg)] p-0.5 overflow-hidden">
        <img
          src="/avatar.jpg"
          alt="Richard McKellar"
          className="w-full h-full rounded-full object-cover"
        />
      </div>
    </div>
  )
}

export default Avatar
