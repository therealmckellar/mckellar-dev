import React from 'react'

/** Clean professional avatar with user uploaded portrait image */
const Avatar: React.FC = () => {
  return (
    <div className="avatar-wrap overflow-hidden animate-fade-in" style={{ animationDelay: '0ms' }}>
      <img
        src="/avatar.jpg"
        alt="Richard McKellar"
        className="w-full h-full object-cover"
      />
    </div>
  )
}

export default Avatar

