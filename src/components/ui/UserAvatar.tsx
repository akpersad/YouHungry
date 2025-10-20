import { memo, useEffect, useState } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  name: string;
  profilePicture?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export const UserAvatar = memo(function UserAvatar({
  name,
  profilePicture,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset states when profilePicture changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [profilePicture]);

  // Generate initials from name
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return '?';
    }
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent background color based on name
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-accent',
      'bg-success',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-destructive',
      'bg-teal-500',
    ];

    if (!name || typeof name !== 'string') {
      return colors[0]; // Default to first color
    }

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const shouldShowImage = !imageError && imageLoaded;
  const shouldShowPlaceholder = imageError || !imageLoaded;

  // If no profilePicture, always show placeholder
  if (!profilePicture) {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          flex
          items-center
          justify-center
          font-medium
          text-white
          overflow-hidden
          ${getBackgroundColor(name)}
          ${className}
        `}
      >
        <span className="select-none">{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex
        items-center
        justify-center
        font-medium
        text-white
        overflow-hidden
        relative
        ${shouldShowPlaceholder ? getBackgroundColor(name) : ''}
        ${className}
      `}
    >
      {/* Always render the Image so onLoad can fire, but hide it until loaded */}
      <Image
        src={profilePicture}
        alt={`${name}'s profile`}
        fill
        className={`object-cover transition-opacity duration-200 ${
          shouldShowImage ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />

      {/* Show placeholder while loading or on error */}
      {shouldShowPlaceholder && (
        <span className="select-none absolute inset-0 flex items-center justify-center">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
});
