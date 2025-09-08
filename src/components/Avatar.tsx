import React from 'react';
import { UserIcon, CameraIcon } from '@heroicons/react/24/outline';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  name?: string;
  isClickable?: boolean;
  showUploadIcon?: boolean;
  onClick?: () => void;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  name,
  isClickable = false,
  showUploadIcon = false,
  onClick,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
    '3xl': 'w-32 h-32 text-3xl'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-12 h-12',
    '3xl': 'w-16 h-16'
  };

  const uploadIconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
    '2xl': 'w-6 h-6',
    '3xl': 'w-8 h-8'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getBackgroundClass = () => {
    // Use theme-aware background color instead of random colors
    return 'user-initials-circle';
  };

  const baseClasses = `
    relative inline-flex items-center justify-center rounded-full
    ${sizeClasses[size]}
    ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `.trim();

  // Construct image URL properly
  const getImageUrl = (src: string) => {
    if (src.startsWith('http')) return src;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${src}`;
  };

  const content = src ? (
    <img
      src={getImageUrl(src)}
      alt={alt || name || 'Avatar'}
      className="w-full h-full rounded-full object-cover"
      onError={(e) => {
        console.error('Avatar image failed to load:', getImageUrl(src));
        // Fallback to initials if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  ) : name ? (
    <div className={`w-full h-full rounded-full ${getBackgroundClass()} text-white font-semibold flex items-center justify-center`}>
      {getInitials(name)}
    </div>
  ) : (
    <div className="w-full h-full rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
      <UserIcon className={iconSizes[size]} />
    </div>
  );

  return (
    <div className={baseClasses} onClick={onClick}>
      {content}
      {showUploadIcon && (
        <div className="absolute -bottom-1 -right-1 profile-icon rounded-full p-1 shadow-lg">
          <CameraIcon className={`${uploadIconSizes[size]} text-white`} />
        </div>
      )}
      {!src && name && (
        <img
          src=""
          alt=""
          className="hidden"
          onError={() => {}} // Hidden fallback image for error handling
        />
      )}
    </div>
  );
};

export default Avatar;