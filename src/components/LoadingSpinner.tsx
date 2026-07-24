import React from 'react';

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Spinning circle */}
        <div className={`absolute inset-0 rounded-full border-2 border-gray-200 border-t-primary-500 animate-spin ${sizeClasses[size]}`}></div>
        {/* Centered LeaveFlow monogram */}
        <span
          aria-label="Loading..."
          className="absolute inset-0 flex items-center justify-center font-semibold text-primary-500 animate-pulse select-none"
          style={{
            fontSize: '55%',
            letterSpacing: '-0.02em',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        >
          LF
        </span>
      </div>
    </div>
  );
};

export default LoadingSpinner;