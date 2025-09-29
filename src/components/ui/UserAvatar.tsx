import React from 'react';
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

export default function UserAvatar({
  name,
  profilePicture,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Generate initials from name
  const getInitials = (name: string) => {
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
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const shouldShowImage = profilePicture && !imageError && imageLoaded;
  const shouldShowPlaceholder = !profilePicture || imageError || !imageLoaded;

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
        ${shouldShowPlaceholder ? getBackgroundColor(name) : ''}
        ${className}
      `}
    >
      {shouldShowImage && (
        <Image
          src={profilePicture}
          alt={`${name}'s profile`}
          fill
          className="object-cover"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}

      {shouldShowPlaceholder && (
        <span className="select-none">{getInitials(name)}</span>
      )}
    </div>
  );
}
